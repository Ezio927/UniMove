import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { Activity } from '../models/Activity';
import { hasLockedActivityUpdates, pickActivityUpdates } from '../utils/activityUpdates';

type ActivityInput = Record<string, unknown>;

const requireValidId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, '无效的活动 ID');
};

const requireOwnerOrAdmin = (organizerId: string, userId: string, role: string) => {
  if (organizerId !== userId && role !== 'admin') throw new AppError(403, '无权操作此活动');
};

export class ActivityService {
  static async create(input: ActivityInput, organizer: string) {
    const {
      title, description, category, location, startTime, endTime,
      maxParticipants, price, images = [], tags = []
    } = input;
    const activity = await Activity.create({
      title, description, category, location,
      startTime: new Date(startTime as string),
      endTime: new Date(endTime as string),
      maxParticipants, price, images, tags, organizer, status: 'published'
    });
    return activity.populate('organizer', 'username email avatar');
  }

  static async getById(id: string) {
    requireValidId(id);
    const activity = await Activity.findById(id)
      .populate('organizer', 'username email avatar phone')
      .populate('participants', 'username avatar');
    if (!activity) throw new AppError(404, '活动不存在');
    return activity;
  }

  static async update(id: string, input: ActivityInput, userId: string, role: string) {
    requireValidId(id);
    const activity = await Activity.findById(id);
    if (!activity) throw new AppError(404, '活动不存在');
    requireOwnerOrAdmin(activity.organizer.toString(), userId, role);

    const updates = pickActivityUpdates(input);
    if (activity.participants.length > 0 && hasLockedActivityUpdates(updates)) {
      throw new AppError(400, '活动已有参与者，不能修改时间、人数或价格');
    }

    return Activity.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('organizer', 'username email avatar');
  }

  static async delete(id: string, userId: string, role: string) {
    requireValidId(id);
    const activity = await Activity.findById(id);
    if (!activity) throw new AppError(404, '活动不存在');
    requireOwnerOrAdmin(activity.organizer.toString(), userId, role);
    if (activity.participants.length > 0) {
      throw new AppError(400, '活动已有参与者，不能删除');
    }
    await activity.deleteOne();
  }
}
