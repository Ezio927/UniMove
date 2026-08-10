import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/AppError';
import { CommentService } from './CommentService';

describe('CommentService input boundaries', () => {
  it('rejects invalid activity IDs before database work', async () => {
    await expect(CommentService.create({ activityId: 'invalid' }, 'user-id'))
      .rejects.toBeInstanceOf(AppError);
  });

  it('rejects invalid ratings before querying comments', async () => {
    await expect(CommentService.getForActivity('507f1f77bcf86cd799439011', { rating: '6' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects invalid comment IDs before updates', async () => {
    await expect(CommentService.update('invalid', {}, 'user-id')).rejects.toBeInstanceOf(AppError);
  });
});
