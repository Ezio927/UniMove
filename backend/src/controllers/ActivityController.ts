import { Response } from 'express';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import { buildActivityCatalogQuery } from '../utils/activityQuery';
import { AppError } from '../errors/AppError';
import { ActivityService } from '../services/ActivityService';

export class ActivityController {
  // 创建活动
  static async createActivity(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const activity = await ActivityService.create(req.body, req.user.userId);
    res.status(201).json({ success: true, message: '活动创建成功', data: { activity } });
  }

  // 获取活动列表
  static async getActivities(req: AuthRequest, res: Response): Promise<void> {
    const { query, page, limit, skip, sort } = buildActivityCatalogQuery(req.query);

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('organizer', 'username email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total
        }
      }
    });
  }

  // 获取活动详情
  static async getActivityById(req: AuthRequest, res: Response): Promise<void> {
    const activity = await ActivityService.getById(req.params.id);
    res.json({ success: true, data: { activity } });
  }

  // 更新活动
  static async updateActivity(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const activity = await ActivityService.update(
      req.params.id, req.body, req.user.userId, req.user.role
    );
    res.json({ success: true, message: '活动更新成功', data: { activity } });
  }

  // 删除活动
  static async deleteActivity(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    await ActivityService.delete(req.params.id, req.user.userId, req.user.role);
    res.json({ success: true, message: '活动删除成功' });
  }

  // 获取我创建的活动
  static async getMyActivities(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const data = await ActivityService.getCreatedByUser(req.user.userId, req.query);
    res.json({ success: true, data });
  }

  // 获取我参加的活动
  static async getJoinedActivities(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const data = await ActivityService.getJoinedByUser(req.user.userId, req.query);
    res.json({ success: true, data });
  }
}
