import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { errorHandler } from './errorHandler';

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  it('returns operational errors with their status', () => {
    const res = response();
    errorHandler(new AppError(422, '输入无效'), {} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: '输入无效' });
  });

  it('hides unexpected production error details', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = response();
    errorHandler(new Error('database details'), {} as never, res as never, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error' });
    process.env.NODE_ENV = previous;
  });
});
