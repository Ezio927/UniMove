import { describe, expect, it, vi } from 'vitest';
import { asyncHandler } from './asyncHandler';

describe('asyncHandler', () => {
  it('forwards rejected promises to Express', async () => {
    const error = new Error('failed');
    const next = vi.fn();
    const handler = asyncHandler(async () => { throw error; });
    handler({} as never, {} as never, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });
});
