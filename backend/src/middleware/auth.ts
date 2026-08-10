import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
      return;
    }

    const decoded = verifyToken(token);
    
    // 验证用户是否存在且活跃
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    next();
  } catch (_error) {
    res.status(403).json({
      success: false,
      message: '访问令牌无效'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '权限不足'
      });
      return;
    }

    next();
  };
};
