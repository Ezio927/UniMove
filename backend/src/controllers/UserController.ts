import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../errors/AppError';
import { UserService } from '../services/UserService';
import { serializeUser } from '../utils/serializeUser';

export class UserController {
  // 用户注册
  static async register(req: Request, res: Response): Promise<void> {
    const { user, token, refreshToken } = await UserService.register(req.body);
    res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: serializeUser(user),
          token,
          refreshToken
        }
    });
  }

  // 用户登录
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const { user, token, refreshToken } = await UserService.login(email, password);
    res.json({
        success: true,
        message: '登录成功',
        data: {
          user: serializeUser(user),
          token,
          refreshToken
        }
    });
  }

  // 获取当前用户信息
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const user = await UserService.getProfile(req.user.userId);

    res.json({
        success: true,
        data: {
          user: serializeUser(user, true)
        }
    });
  }

  // 更新用户信息
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const user = await UserService.updateProfile(req.user.userId, req.body);
    res.json({
        success: true,
        message: '更新成功',
        data: {
          user: serializeUser(user)
        }
    });
  }

  // 修改密码
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError(401, '未认证');
    const { currentPassword, newPassword } = req.body;
    await UserService.changePassword(req.user.userId, currentPassword, newPassword);
    res.json({ success: true, message: '密码修改成功' });
  }
}
