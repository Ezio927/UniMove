import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './users';
import activityRoutes from './activities';
import orderRoutes from './orders';
import commentRoutes from './comments';

const router = Router();

// API 路由
router.use('/users', userRoutes);
router.use('/activities', activityRoutes);
router.use('/orders', orderRoutes);
router.use('/comments', commentRoutes);

// 健康检查
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    success: true,
    message: 'UniMove API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbStatus as keyof typeof dbStatusMap]
    },
    version: '1.0.0'
  });
});

export default router;
