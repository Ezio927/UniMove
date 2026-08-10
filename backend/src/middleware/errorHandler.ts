import { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const knownError = error instanceof AppError;
  const statusCode = knownError ? error.statusCode : 500;
  const exposeMessage = knownError || process.env.NODE_ENV !== 'production';

  if (!knownError) console.error('Unhandled error:', error);

  res.status(statusCode).json({
    success: false,
    message: exposeMessage && error instanceof Error ? error.message : 'Internal server error',
    ...(knownError && error.details !== undefined ? { details: error.details } : {})
  });
};
