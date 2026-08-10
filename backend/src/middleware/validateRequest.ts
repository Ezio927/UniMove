import { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';

export const validateBody = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, '请求数据无效', result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    })));
  }
  req.body = result.data;
  next();
};
