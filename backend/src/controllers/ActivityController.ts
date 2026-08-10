import { Response } from 'express';
import { Activity, IActivity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { hasLockedActivityUpdates, pickActivityUpdates } from '../utils/activityUpdates';

export class ActivityController {
  // 创建活动
  static async createActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        category,
        location,
        startTime,
        endTime,
        maxParticipants,
        price,
        images,
        tags
      } = req.body;

      const activity: IActivity = new Activity({
        title,
        description,
        category,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxParticipants,
        price,
        images: images || [],
        tags: tags || [],
        organizer: req.user?.userId,
        status: 'published'
      });

      await activity.save();
      await activity.populate('organizer', 'username email avatar');

      res.status(201).json({
        success: true,
        message: '活动创建成功',
        data: { activity }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '活动创建失败'
      });
    }
  }

  // 获取活动列表
  static async getActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        location,
        search,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query: any = { status: 'published' };

      // 分类筛选
      if (category) {
        query.category = category;
      }

      // 地点筛选
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }

      // 搜索
      if (search) {
        query.$or = [
          { title: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
          { category: { $regex: search as string, $options: 'i' } },
          { location: { $regex: search as string, $options: 'i' } }
        ];
      }

      // 时间筛选
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) {
          query.startTime.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.startTime.$lte = new Date(endDate as string);
        }
      }

      // 价格筛选
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) {
          query.price.$gte = Number(minPrice);
        }
        if (maxPrice) {
          query.price.$lte = Number(maxPrice);
        }
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (Number(page) - 1) * Number(limit);

      const [activities, total] = await Promise.all([
        Activity.find(query)
          .populate('organizer', 'username email avatar')
          .sort(sortOptions)
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
        message: error.message || '获取活动列表失败'
      });
    }
  }

  // 获取活动详情
  static async getActivityById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的活动ID'
        });
        return;
      }

      const activity = await Activity.findById(id)
        .populate('organizer', 'username email avatar phone')
        .populate('participants', 'username avatar');

      if (!activity) {
        res.status(404).json({
          success: false,
          message: '活动不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: { activity }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取活动详情失败'
      });
    }
  }

  // 更新活动
  static async updateActivity(req: AuthRequest, res: Response): Promise<void> {
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

      // 检查权限
      if (activity.organizer.toString() !== userId && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '无权修改此活动'
        });
        return;
      }

      const updateData = pickActivityUpdates(req.body);

      // 如果活动已有参与者，限制某些字段的修改
      if (activity.participants.length > 0) {
        if (hasLockedActivityUpdates(updateData)) {
          res.status(400).json({
            success: false,
            message: '活动已有参与者，不能修改时间、人数或价格'
          });
          return;
        }
      }

      const updatedActivity = await Activity.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('organizer', 'username email avatar');

      res.json({
        success: true,
        message: '活动更新成功',
        data: { activity: updatedActivity }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '活动更新失败'
      });
    }
  }

  // 删除活动
  static async deleteActivity(req: AuthRequest, res: Response): Promise<void> {
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

      // 检查权限
      if (activity.organizer.toString() !== userId && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '无权删除此活动'
        });
        return;
      }

      // 如果活动已有参与者，不允许删除
      if (activity.participants.length > 0) {
        res.status(400).json({
          success: false,
          message: '活动已有参与者，不能删除'
        });
        return;
      }

      await Activity.findByIdAndDelete(id);

      res.json({
        success: true,
        message: '活动删除成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '活动删除失败'
      });
    }
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
