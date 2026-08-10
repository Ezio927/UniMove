import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validateRequest';
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validation/schemas';

const router = Router();

// 公开路由
router.post('/register', validateBody(registerSchema), asyncHandler(UserController.register));
router.post('/login', validateBody(loginSchema), asyncHandler(UserController.login));

// 需要认证的路由
router.use(authenticateToken);
router.get('/profile', asyncHandler(UserController.getProfile));
router.put('/profile', validateBody(updateProfileSchema), asyncHandler(UserController.updateProfile));
router.put('/password', validateBody(changePasswordSchema), asyncHandler(UserController.changePassword));

export default router;
