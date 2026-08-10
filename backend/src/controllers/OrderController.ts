import { Response } from 'express';
import { AppError } from '../errors/AppError';
import { AuthRequest } from '../middleware/auth';
import { OrderService } from '../services/OrderService';

const requireUser = (req: AuthRequest) => {
  if (!req.user) throw new AppError(401, '未认证');
  return req.user;
};

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const order = await OrderService.create(req.body.activityId, user.userId);
    res.status(201).json({ success: true, message: '报名成功', data: { order } });
  }

  static async getUserOrders(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const data = await OrderService.getForUser(user.userId, req.query);
    res.json({ success: true, data });
  }

  static async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const order = await OrderService.getById(req.params.id, user.userId, user.role);
    res.json({ success: true, data: { order } });
  }

  static async payOrder(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const order = await OrderService.pay(req.params.id, user.userId, req.body.paymentMethod);
    res.json({ success: true, message: '支付成功', data: { order } });
  }

  static async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const order = await OrderService.cancel(req.params.id, user.userId, req.body.reason);
    res.json({ success: true, message: '订单取消成功', data: { order } });
  }

  static async getActivityOrders(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const data = await OrderService.getForActivity(
      req.params.activityId, user.userId, user.role, req.query
    );
    res.json({ success: true, data });
  }
}
