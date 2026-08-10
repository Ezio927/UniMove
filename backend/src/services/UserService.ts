import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { generateRefreshToken, generateToken } from '../utils/jwt';

export class UserService {
  static async register(input: { username: string; email: string; password: string; phone?: string }) {
    const existingUser = await User.findOne({
      $or: [{ email: input.email }, { username: input.username }]
    });
    if (existingUser) throw new AppError(409, '用户名或邮箱已存在');

    const user = await User.create({ ...input, role: 'user' });
    return { user, token: generateToken(user), refreshToken: generateRefreshToken(user) };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user || !await user.comparePassword(password)) {
      throw new AppError(401, '邮箱或密码错误');
    }
    if (!user.isActive) throw new AppError(401, '账户已被禁用');
    return { user, token: generateToken(user), refreshToken: generateRefreshToken(user) };
  }

  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new AppError(404, '用户不存在');
    return user;
  }

  static async updateProfile(userId: string, input: { username?: string; phone?: string; avatar?: string }) {
    const updates = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined)
    );
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!user) throw new AppError(404, '用户不存在');
    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(404, '用户不存在');
    if (!await user.comparePassword(currentPassword)) {
      throw new AppError(400, '当前密码错误');
    }
    user.password = newPassword;
    await user.save();
  }

  static async getFavorites(userId: string) {
    const user = await User.findById(userId).select('favoriteActivities');
    if (!user) throw new AppError(404, '\u7528\u6237\u4e0d\u5b58\u5728');
    if (!user.favoriteActivities?.length) return [];

    return Activity.find({ _id: { $in: user.favoriteActivities } })
      .populate('organizer', 'username email avatar')
      .sort({ createdAt: -1 });
  }

  static async addFavorite(userId: string, activityId: string) {
    if (!mongoose.isValidObjectId(activityId)) throw new AppError(400, '\u6d3b\u52a8 ID \u65e0\u6548');
    if (!await Activity.exists({ _id: activityId })) throw new AppError(404, '\u6d3b\u52a8\u4e0d\u5b58\u5728');

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteActivities: activityId } },
      { new: true }
    ).select('favoriteActivities');
    if (!user) throw new AppError(404, '\u7528\u6237\u4e0d\u5b58\u5728');

    return user.favoriteActivities;
  }

  static async removeFavorite(userId: string, activityId: string) {
    if (!mongoose.isValidObjectId(activityId)) throw new AppError(400, '\u6d3b\u52a8 ID \u65e0\u6548');

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteActivities: activityId } },
      { new: true }
    ).select('favoriteActivities');
    if (!user) throw new AppError(404, '\u7528\u6237\u4e0d\u5b58\u5728');

    return user.favoriteActivities;
  }
}
