import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validateRequest';
import { cancelOrderSchema, createOrderSchema, payOrderSchema } from '../validation/schemas';

const router = Router();

// 所有订单路由都需要认证
router.post('/', authenticateToken, validateBody(createOrderSchema), asyncHandler(OrderController.createOrder));
router.get('/', authenticateToken, asyncHandler(OrderController.getUserOrders));
router.get('/:id', authenticateToken, asyncHandler(OrderController.getOrderById));
router.put('/:id/pay', authenticateToken, validateBody(payOrderSchema), asyncHandler(OrderController.payOrder));
router.put('/:id/cancel', authenticateToken, validateBody(cancelOrderSchema), asyncHandler(OrderController.cancelOrder));
router.get('/activity/:activityId', authenticateToken, asyncHandler(OrderController.getActivityOrders));

export default router;
