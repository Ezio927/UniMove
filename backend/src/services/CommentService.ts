import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { Activity } from '../models/Activity';
import { Comment } from '../models/Comment';
import { Order } from '../models/Order';
import { ActivityQueryInput, parsePagination } from '../utils/activityQuery';

type CommentInput = Record<string, unknown>;

const requireValidId = (id: string, resource: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, `无效的${resource} ID`);
};

const parseRating = (value: unknown) => {
  if (value === undefined) return undefined;
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(400, '评分必须是 1 到 5 的整数');
  }
  return rating;
};

export class CommentService {
  static async create(input: CommentInput, userId: string) {
    const activityId = input.activityId as string;
    requireValidId(activityId, '活动');
    if (!await Activity.exists({ _id: activityId })) throw new AppError(404, '活动不存在');
    if (!await Order.exists({ user: userId, activity: activityId, status: 'paid' })) {
      throw new AppError(403, '只有参加过活动的用户才能评论');
    }
    if (await Comment.exists({ user: userId, activity: activityId })) {
      throw new AppError(409, '您已评论过此活动');
    }
    const comment = await Comment.create({
      user: userId,
      activity: activityId,
      content: input.content,
      rating: input.rating,
      images: input.images ?? []
    });
    return comment.populate('user', 'username avatar');
  }

  static async getForActivity(activityId: string, input: ActivityQueryInput) {
    requireValidId(activityId, '活动');
    const { page, limit, skip } = parsePagination(input);
    const rating = parseRating(input.rating);
    const query = { activity: activityId, ...(rating && { rating }) };
    const [comments, total, aggregate] = await Promise.all([
      Comment.find(query).populate('user', 'username avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments(query),
      Comment.aggregate([
        { $match: { activity: new mongoose.Types.ObjectId(activityId) } },
        { $group: {
          _id: null, averageRating: { $avg: '$rating' }, totalComments: { $sum: 1 },
          ratingDistribution: { $push: '$rating' }
        } }
      ])
    ]);
    const summary = aggregate[0] ?? { averageRating: 0, totalComments: 0, ratingDistribution: [] };
    const counts = [0, 0, 0, 0, 0];
    summary.ratingDistribution.forEach((item: number) => { if (item >= 1 && item <= 5) counts[item - 1]++; });
    return {
      comments,
      statistics: {
        averageRating: Number(summary.averageRating.toFixed(1)),
        totalComments: summary.totalComments,
        ratingDistribution: counts.map((count, index) => ({ rating: index + 1, count }))
      },
      pagination: { current: page, total: Math.ceil(total / limit), count: total }
    };
  }

  static async getForUser(userId: string, input: ActivityQueryInput) {
    const { page, limit, skip } = parsePagination(input);
    const [comments, total] = await Promise.all([
      Comment.find({ user: userId }).populate('activity', 'title startTime endTime location images')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments({ user: userId })
    ]);
    return { comments, pagination: { current: page, total: Math.ceil(total / limit), count: total } };
  }

  static async update(id: string, input: CommentInput, userId: string) {
    requireValidId(id, '评论');
    const comment = await Comment.findById(id);
    if (!comment) throw new AppError(404, '评论不存在');
    if (comment.user.toString() !== userId) throw new AppError(403, '无权修改此评论');
    if ((Date.now() - comment.createdAt.getTime()) / 3_600_000 > 24) {
      throw new AppError(400, '评论创建 24 小时后不可修改');
    }
    const updates = Object.fromEntries(
      ['content', 'rating', 'images']
        .filter(key => input[key] !== undefined)
        .map(key => [key, input[key]])
    );
    return Comment.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('user', 'username avatar');
  }

  static async delete(id: string, userId: string, role: string) {
    requireValidId(id, '评论');
    const comment = await Comment.findById(id);
    if (!comment) throw new AppError(404, '评论不存在');
    if (comment.user.toString() !== userId && role !== 'admin') {
      throw new AppError(403, '无权删除此评论');
    }
    await comment.deleteOne();
  }
}
