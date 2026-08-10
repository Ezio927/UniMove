import { Response } from 'express';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
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

  // 参加活动
  static async joinActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的活动ID'
        });
        return;
      }

      const activity = await Activity.findById(id);

      if (!activity) {
        res.status(404).json({
          success: false,
          message: '活动不存在'
        });
        return;
      }

      // 检查活动状态
      if (activity.status !== 'published') {
        res.status(400).json({
          success: false,
          message: '活动不可报名'
        });
        return;
      }

      // 检查活动是否已开始
      if (new Date() >= activity.startTime) {
        res.status(400).json({
          success: false,
          message: '活动已开始，无法报名'
        });
        return;
      }

      // 检查是否已参加
      if (activity.participants.includes(userId as any)) {
        res.status(400).json({
          success: false,
          message: '您已参加此活动'
        });
        return;
      }

      // 检查人数限制
      if (activity.currentParticipants >= activity.maxParticipants) {
        res.status(400).json({
          success: false,
          message: '活动人数已满'
        });
        return;
      }

      // 添加参与者
      activity.participants.push(userId as any);
      activity.currentParticipants += 1;
      await activity.save();

      res.json({
        success: true,
        message: '报名成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '报名失败'
      });
    }
  }

  // 退出活动
  static async leaveActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的活动ID'
        });
        return;
      }

      const activity = await Activity.findById(id);

      if (!activity) {
        res.status(404).json({
          success: false,
          message: '活动不存在'
        });
        return;
      }

      // 检查是否参加了活动
      if (!activity.participants.includes(userId as any)) {
        res.status(400).json({
          success: false,
          message: '您未参加此活动'
        });
        return;
      }

      // 检查活动是否已开始
      if (new Date() >= activity.startTime) {
        res.status(400).json({
          success: false,
          message: '活动已开始，无法退出'
        });
        return;
      }

      // 移除参与者
      activity.participants = activity.participants.filter(
        participant => participant.toString() !== userId
      );
      activity.currentParticipants -= 1;
      await activity.save();

      res.json({
        success: true,
        message: '退出成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '退出失败'
      });
    }
  }

  // 获取我创建的活动
  static async getMyActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10, status } = req.query;

      const query: any = { organizer: userId };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [activities, total] = await Promise.all([
        Activity.find(query)
          .populate('organizer', 'username email avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Activity.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            current: Number(page),
            total: Math.ceil(total / Number(limit)),
            count: total
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取我的活动失败'
      });
    }
  }

  // 获取我参加的活动
  static async getJoinedActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const [activities, total] = await Promise.all([
        Activity.find({ participants: userId })
          .populate('organizer', 'username email avatar')
          .sort({ startTime: 1 })
          .skip(skip)
          .limit(Number(limit)),
        Activity.countDocuments({ participants: userId })
      ]);

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            current: Number(page),
            total: Math.ceil(total / Number(limit)),
            count: total
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取参加的活动失败'
      });
    }
  }
}
