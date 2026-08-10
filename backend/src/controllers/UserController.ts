import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  // 用户注册
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, phone } = req.body;

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在'
        });
        return;
      }

      // 创建新用户
      const user: IUser = new User({
        username,
        email,
        password,
        phone,
        role: 'user'
      });

      await user.save();

      // 生成token
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            role: user.role
          },
          token,
          refreshToken
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '注册失败'
      });
    }
  }

  // 用户登录
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // 查找用户
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
        return;
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
        return;
      }

      // 检查账户状态
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: '账户已被禁用'
        });
        return;
      }

      // 生成token
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            role: user.role
          },
          token,
          refreshToken
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '登录失败'
      });
    }
  }

  // 获取当前用户信息
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?.userId).select('-password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取用户信息失败'
      });
    }
  }

  // 更新用户信息
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, phone, avatar } = req.body;
      const userId = req.user?.userId;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          ...(username && { username }),
          ...(phone && { phone }),
          ...(avatar && { avatar })
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '更新成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            role: user.role
          }
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新失败'
      });
    }
  }

  // 修改密码
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: '当前密码错误'
        });
        return;
      }

      // 更新密码
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '密码修改失败'
      });
    }
  }
}
