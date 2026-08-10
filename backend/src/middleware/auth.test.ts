import { describe, expect, it, vi } from 'vitest';
import { requireRole } from './auth';

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('requireRole', () => {
  it('rejects an authenticated user without the required role', () => {
    const res = response();
    const next = vi.fn();
    requireRole(['admin'])({ user: { role: 'user' } } as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a user with the required role', () => {
    const next = vi.fn();
    requireRole(['admin'])({ user: { role: 'admin' } } as never, response() as never, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
