import { Response } from 'express';
import { Order, IOrder } from '../models/Order';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { OrderService } from '../services/OrderService';

export class OrderController {
  // 创建订单
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    let reservedActivityId: string | null = null;
    const userId = req.user?.userId;

    try {
      const { activityId } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(activityId)) {
        res.status(400).json({
          success: false,
          message: '无效的活动ID'
        });
        return;
      }

      // 检查是否已有订单
      const existingOrder = await Order.findOne({
        user: userId,
        activity: activityId,
        status: { $in: ['pending', 'paid'] }
      });

      if (existingOrder) {
        res.status(400).json({
          success: false,
          message: '您已有此活动的订单'
        });
        return;
      }

      // 原子预留名额：同一用户不能重复加入，且人数不能超过上限。
      const activity = await Activity.findOneAndUpdate(
        {
          _id: activityId,
          organizer: { $ne: userId },
          status: 'published',
          startTime: { $gt: new Date() },
          participants: { $ne: userId },
          $expr: { $lt: ['$currentParticipants', '$maxParticipants'] }
        },
        {
          $addToSet: { participants: userId },
          $inc: { currentParticipants: 1 }
        },
        { new: true }
      );

      if (!activity) {
        res.status(400).json({
          success: false,
          message: '活动不可报名、人数已满或您已报名'
        });
        return;
      }
      reservedActivityId = activityId;

      // 创建订单
      const order: IOrder = new Order({
        user: userId,
        activity: activityId,
        amount: activity.price,
        status: 'paid' // 直接设置为已支付状态，简化流程
      });

      await order.save();
      reservedActivityId = null;

      await order.populate([
        { path: 'user', select: 'username email' },
        { path: 'activity', select: 'title startTime endTime location price' }
      ]);

      res.status(201).json({
        success: true,
        message: '报名成功！',
        data: { order }
      });
    } catch (error: any) {
      if (reservedActivityId && userId) {
        await Activity.updateOne(
          { _id: reservedActivityId, participants: userId },
          { $pull: { participants: userId }, $inc: { currentParticipants: -1 } }
        ).catch(() => undefined);
      }

      res.status(400).json({
        success: false,
        message: error.message || '订单创建失败'
      });
    }
  }

  // 获取用户订单列表
  static async getUserOrders(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const data = await OrderService.getForUser(req.user.userId, req.query);
    res.json({ success: true, data });
  }

  // 获取订单详情
  static async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const order = await OrderService.getById(req.params.id, req.user.userId, req.user.role);
    res.json({ success: true, data: { order } });
  }

  // 支付订单
  static async payOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
        return;
      }

      const order = await Order.findOne({ _id: id, user: userId }).populate('activity');

      if (!order) {
        res.status(404).json({
          success: false,
          message: '订单不存在'
        });
        return;
      }

      // 检查订单状态
      if (order.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: '订单状态不正确'
        });
        return;
      }

      // 检查活动是否还有名额
      const activity = await Activity.findById(order.activity);
      if (!activity || activity.currentParticipants >= activity.maxParticipants) {
        res.status(400).json({
          success: false,
          message: '活动人数已满'
        });
        return;
      }

      // 模拟支付成功（实际项目中需要对接支付网关）
      order.status = 'paid';
      order.paymentMethod = paymentMethod;
      order.paymentTime = new Date();
      await order.save();

      // 更新活动参与人数
      if (!activity.participants.includes(userId as any)) {
        activity.participants.push(userId as any);
        activity.currentParticipants += 1;
        await activity.save();
      }

      res.json({
        success: true,
        message: '支付成功',
        data: { order }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '支付失败'
      });
    }
  }

  // 取消订单
  static async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
        return;
      }

      const order = await Order.findById(id).populate('activity');

      if (!order) {
        res.status(404).json({
          success: false,
          message: '订单不存在'
        });
        return;
      }

      // 检查权限
      if (order.user.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: '无权操作此订单'
        });
        return;
      }

      // 检查订单状态
      if (order.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: '订单已取消'
        });
        return;
      }

      // 如果是已支付订单，需要退款
      if (order.status === 'paid') {
        const activity = order.activity as any;
        
        // 检查是否可以取消（活动开始前24小时）
        const hoursUntilStart = (activity.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
        if (hoursUntilStart < 24) {
          res.status(400).json({
            success: false,
            message: '活动开始前24小时内不可取消'
          });
          return;
        }

        // 只有一个并发请求能完成 paid -> refunded 状态迁移。
        const refundedOrder = await Order.findOneAndUpdate(
          { _id: id, user: userId, status: 'paid' },
          {
            $set: {
              status: 'refunded',
              refundAmount: order.amount,
              refundTime: new Date(),
              cancelReason: reason || '用户取消'
            }
          },
          { new: true }
        );

        if (!refundedOrder) {
          res.status(409).json({
            success: false,
            message: '订单状态已发生变化，请刷新后重试'
          });
          return;
        }

        await Activity.updateOne(
          { _id: activity._id, participants: userId },
          {
            $pull: { participants: userId },
            $inc: { currentParticipants: -1 }
          }
        );

        res.json({
          success: true,
          message: '订单取消成功',
          data: { order: refundedOrder }
        });
        return;
      } else {
        order.status = 'cancelled';
      }

      order.cancelReason = reason || '用户取消';
      await order.save();

      res.json({
        success: true,
        message: '订单取消成功',
        data: { order }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '订单取消失败'
      });
    }
  }

  // 获取活动的订单列表（组织者使用）
  static async getActivityOrders(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const data = await OrderService.getForActivity(
      req.params.activityId, req.user.userId, req.user.role, req.query
    );
    res.json({ success: true, data });
  }
}
