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
