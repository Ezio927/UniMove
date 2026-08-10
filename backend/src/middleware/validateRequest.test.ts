import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { validateBody } from './validateRequest';

const schema = z.strictObject({ name: z.string().trim().min(1) });

describe('validateBody', () => {
  it('replaces the body with parsed data', () => {
    const req = { body: { name: '  UniMove  ' } };
    const next = vi.fn();
    validateBody(schema)(req as never, {} as never, next);
    expect(req.body).toEqual({ name: 'UniMove' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects invalid and unknown fields with details', () => {
    expect(() => validateBody(schema)(
      { body: { name: '', role: 'admin' } } as never, {} as never, vi.fn()
    )).toThrow(AppError);
  });
});
