import { Response } from 'express';
import { AppError } from '../errors/AppError';
import { AuthRequest } from '../middleware/auth';
import { CommentService } from '../services/CommentService';

const requireUser = (req: AuthRequest) => {
  if (!req.user) throw new AppError(401, '未认证');
  return req.user;
};

export class CommentController {
  static async createComment(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const comment = await CommentService.create(req.body, user.userId);
    res.status(201).json({ success: true, message: '评论创建成功', data: { comment } });
  }

  static async getActivityComments(req: AuthRequest, res: Response): Promise<void> {
    const data = await CommentService.getForActivity(req.params.activityId, req.query);
    res.json({ success: true, data });
  }

  static async getUserComments(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const data = await CommentService.getForUser(user.userId, req.query);
    res.json({ success: true, data });
  }

  static async updateComment(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    const comment = await CommentService.update(req.params.id, req.body, user.userId);
    res.json({ success: true, message: '评论更新成功', data: { comment } });
  }

  static async deleteComment(req: AuthRequest, res: Response): Promise<void> {
    const user = requireUser(req);
    await CommentService.delete(req.params.id, user.userId, user.role);
    res.json({ success: true, message: '评论删除成功' });
  }
}
