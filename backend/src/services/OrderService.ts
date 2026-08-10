import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { Activity } from '../models/Activity';
import { Order } from '../models/Order';
import { ActivityQueryInput } from '../utils/activityQuery';
import { parseOrderListQuery } from '../utils/orderQuery';

const requireValidId = (id: string, resource: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, `无效的${resource} ID`);
};

export class OrderService {
  static async create(activityId: string, userId: string) {
    requireValidId(activityId, '活动');
    const existingOrder = await Order.findOne({
      user: userId, activity: activityId, status: { $in: ['pending', 'paid'] }
    });
    if (existingOrder) throw new AppError(409, '您已有此活动的订单');

    const activity = await Activity.findOneAndUpdate(
      {
        _id: activityId, organizer: { $ne: userId }, status: 'published',
        startTime: { $gt: new Date() }, participants: { $ne: userId },
        $expr: { $lt: ['$currentParticipants', '$maxParticipants'] }
      },
      { $addToSet: { participants: userId }, $inc: { currentParticipants: 1 } },
      { new: true }
    );
    if (!activity) throw new AppError(409, '活动不可报名、人数已满或您已报名');

    try {
      const order = await Order.create({
        user: userId, activity: activityId, amount: activity.price, status: 'paid'
      });
      return order.populate([
        { path: 'user', select: 'username email' },
        { path: 'activity', select: 'title startTime endTime location price' }
      ]);
    } catch (error) {
      await Activity.updateOne(
        { _id: activityId, participants: userId },
        { $pull: { participants: userId }, $inc: { currentParticipants: -1 } }
      ).catch(() => undefined);
      throw error;
    }
  }

  static async pay(id: string, userId: string, paymentMethod: string) {
    requireValidId(id, '订单');
    if (!['wechat', 'alipay', 'card'].includes(paymentMethod)) {
      throw new AppError(400, '无效的支付方式');
    }
    const order = await Order.findOne({ _id: id, user: userId, status: 'pending' });
    if (!order) throw new AppError(409, '订单不存在或状态已发生变化');

    const activityId = order.activity.toString();
    const activity = await Activity.findOneAndUpdate(
      {
        _id: activityId, status: 'published', startTime: { $gt: new Date() },
        participants: { $ne: userId },
        $expr: { $lt: ['$currentParticipants', '$maxParticipants'] }
      },
      { $addToSet: { participants: userId }, $inc: { currentParticipants: 1 } },
      { new: true }
    );
    if (!activity) throw new AppError(409, '活动不可报名或人数已满');

    const paidOrder = await Order.findOneAndUpdate(
      { _id: id, user: userId, status: 'pending' },
      { $set: { status: 'paid', paymentMethod, paymentTime: new Date() } },
      { new: true }
    );
    if (!paidOrder) {
      await Activity.updateOne(
        { _id: activityId, participants: userId },
        { $pull: { participants: userId }, $inc: { currentParticipants: -1 } }
      );
      throw new AppError(409, '订单状态已发生变化，请刷新后重试');
    }
    return paidOrder;
  }

  static async cancel(id: string, userId: string, reason?: string) {
    requireValidId(id, '订单');
    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) throw new AppError(404, '订单不存在');
    if (order.status === 'cancelled' || order.status === 'refunded') {
      throw new AppError(409, '订单已取消或退款');
    }
    const cancelReason = reason || '用户取消';

    if (order.status === 'pending') {
      const cancelled = await Order.findOneAndUpdate(
        { _id: id, user: userId, status: 'pending' },
        { $set: { status: 'cancelled', cancelReason } }, { new: true }
      );
      if (!cancelled) throw new AppError(409, '订单状态已发生变化，请刷新后重试');
      return cancelled;
    }

    const activity = await Activity.findById(order.activity);
    if (!activity) throw new AppError(404, '活动不存在');
    const hoursUntilStart = (activity.startTime.getTime() - Date.now()) / 3_600_000;
    if (hoursUntilStart < 24) throw new AppError(400, '活动开始前 24 小时内不可取消');

    const refunded = await Order.findOneAndUpdate(
      { _id: id, user: userId, status: 'paid' },
      { $set: {
        status: 'refunded', refundAmount: order.amount, refundTime: new Date(), cancelReason
      } },
      { new: true }
    );
    if (!refunded) throw new AppError(409, '订单状态已发生变化，请刷新后重试');

    try {
      await Activity.updateOne(
        { _id: activity._id, participants: userId, currentParticipants: { $gt: 0 } },
        { $pull: { participants: userId }, $inc: { currentParticipants: -1 } }
      );
    } catch (error) {
      await Order.updateOne(
        { _id: id, status: 'refunded' },
        { $set: { status: 'paid' }, $unset: { refundAmount: 1, refundTime: 1, cancelReason: 1 } }
      ).catch(() => undefined);
      throw error;
    }
    return refunded;
  }

  static async getForUser(userId: string, input: ActivityQueryInput) {
    const { page, limit, skip, status } = parseOrderListQuery(input);
    const query = { user: userId, ...(status && { status }) };
    const [orders, total] = await Promise.all([
      Order.find(query).populate('activity', 'title startTime endTime location price images')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);
    return { orders, pagination: { current: page, total: Math.ceil(total / limit), count: total } };
  }

  static async getById(id: string, userId: string, role: string) {
    requireValidId(id, '订单');
    const order = await Order.findById(id);
    if (!order) throw new AppError(404, '订单不存在');
    if (order.user.toString() !== userId && role !== 'admin') {
      throw new AppError(403, '无权查看此订单');
    }
    return order.populate([
      { path: 'user', select: 'username email phone' },
      { path: 'activity', select: 'title description startTime endTime location price images organizer' },
      { path: 'activity.organizer', select: 'username phone' }
    ]);
  }

  static async getForActivity(
    activityId: string, userId: string, role: string, input: ActivityQueryInput
  ) {
    requireValidId(activityId, '活动');
    const activity = await Activity.findById(activityId);
    if (!activity) throw new AppError(404, '活动不存在');
    if (activity.organizer.toString() !== userId && role !== 'admin') {
      throw new AppError(403, '无权查看此活动的订单');
    }

    const { page, limit, skip, status } = parseOrderListQuery(input);
    const query = { activity: activityId, ...(status && { status }) };
    const [orders, total] = await Promise.all([
      Order.find(query).populate('user', 'username email phone avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);
    return { orders, pagination: { current: page, total: Math.ceil(total / limit), count: total } };
  }
}
