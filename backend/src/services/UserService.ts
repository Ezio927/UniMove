import { AppError } from '../errors/AppError';
import mongoose from 'mongoose';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { generateRefreshToken, generateToken } from '../utils/jwt';

export class UserService {
  static async addFavorite(userId: string, activityId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new AppError(400, '无效的活动 ID');
    }

    const activity = await Activity.findById(activityId);
    if (!activity) throw new AppError(404, '活动不存在');

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteActivities: activityId } },
      { new: true }
    );
    if (!user) throw new AppError(404, '用户不存在');
  }

  static async removeFavorite(userId: string, activityId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new AppError(400, '无效的活动 ID');
    }

    await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteActivities: activityId } },
      { new: true }
    );
  }

  static async getFavorites(userId: string) {
    const user = await User.findById(userId);
    const favoriteActivities = user?.favoriteActivities ?? [];

    return Activity.find({
      _id: { $in: favoriteActivities },
      status: { $ne: 'cancelled' }
    })
      .populate('organizer', 'username email avatar')
      .sort({ createdAt: -1 });
  }

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
}
