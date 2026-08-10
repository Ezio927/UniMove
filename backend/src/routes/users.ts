import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// 公开路由
router.post('/register', asyncHandler(UserController.register));
router.post('/login', asyncHandler(UserController.login));

// 需要认证的路由
router.use(authenticateToken);
router.get('/profile', asyncHandler(UserController.getProfile));
router.put('/profile', asyncHandler(UserController.updateProfile));
router.put('/password', asyncHandler(UserController.changePassword));

export default router;
