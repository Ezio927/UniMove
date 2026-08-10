import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { connectDatabase } from './utils/database';
import { getAllowedOrigins, validateEnvironment } from './utils/env';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));

app.use('/api/users/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api', routes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'UniMove API Server',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 启动服务器
const startServer = async () => {
  try {
    validateEnvironment();
    // 连接数据库
    await connectDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 UniMove API Server is running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
