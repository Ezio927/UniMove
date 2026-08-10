import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// 用户相关的活动路由（必须在 /:id 之前定义）
router.get('/my/created', authenticateToken, ActivityController.getMyActivities);
router.get('/my/joined', authenticateToken, ActivityController.getJoinedActivities);

// 公开路由
router.get('/', asyncHandler(ActivityController.getActivities));
router.get('/:id', asyncHandler(ActivityController.getActivityById));

// 需要认证的路由
router.post('/', authenticateToken, asyncHandler(ActivityController.createActivity));
router.put('/:id', authenticateToken, asyncHandler(ActivityController.updateActivity));
router.delete('/:id', authenticateToken, asyncHandler(ActivityController.deleteActivity));

export default router;
