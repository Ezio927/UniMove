import { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import mongoose from 'mongoose';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = error instanceof AppError;
  const validationError = error instanceof mongoose.Error.ValidationError
    || error instanceof mongoose.Error.CastError;
  const duplicateError = typeof error === 'object' && error !== null
    && 'code' in error && error.code === 11000;
  const knownError = appError || validationError || duplicateError;
  const statusCode = appError ? error.statusCode : duplicateError ? 409 : validationError ? 400 : 500;
  const exposeMessage = knownError || process.env.NODE_ENV !== 'production';

  if (!knownError) console.error('Unhandled error:', error);

  res.status(statusCode).json({
    success: false,
    message: exposeMessage && error instanceof Error ? error.message : 'Internal server error',
    ...(appError && error.details !== undefined ? { details: error.details } : {})
  });
};
