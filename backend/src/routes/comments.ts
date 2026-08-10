import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// 公开路由
router.get('/activity/:activityId', asyncHandler(CommentController.getActivityComments));

// 需要认证的路由
router.post('/', authenticateToken, asyncHandler(CommentController.createComment));
router.get('/my', authenticateToken, asyncHandler(CommentController.getUserComments));
router.put('/:id', authenticateToken, asyncHandler(CommentController.updateComment));
router.delete('/:id', authenticateToken, asyncHandler(CommentController.deleteComment));

export default router;
