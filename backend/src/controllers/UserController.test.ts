import { describe, expect, it, vi } from 'vitest';
import { UserController } from './UserController';
import { UserService } from '../services/UserService';

const user = { userId: '507f1f77bcf86cd799439011', email: 'student@example.com', role: 'user' as const };

const response = () => {
  const json = vi.fn();
  return { json, res: { json } };
};

describe('UserController favorites', () => {
  it('returns activities from the authenticated user favorites list', async () => {
    const activities = [{ _id: '507f1f77bcf86cd799439012', status: 'completed' }];
    vi.spyOn(UserService, 'getFavorites').mockResolvedValue(activities as never);
    const { json, res } = response();

    await UserController.getFavorites({ user } as never, res as never);

    expect(json).toHaveBeenCalledWith({ success: true, data: { activities } });
  });

  it('returns favorite IDs after adding an activity', async () => {
    const favoriteActivityIds = ['507f1f77bcf86cd799439012'];
    vi.spyOn(UserService, 'addFavorite').mockResolvedValue(favoriteActivityIds as never);
    const { json, res } = response();

    await UserController.addFavorite({ user, params: { activityId: favoriteActivityIds[0] } } as never, res as never);

    expect(json).toHaveBeenCalledWith({
      success: true,
      message: '\u6536\u85cf\u6210\u529f',
      data: { favoriteActivityIds }
    });
  });

  it('returns favorite IDs after an idempotent removal', async () => {
    vi.spyOn(UserService, 'removeFavorite').mockResolvedValue([] as never);
    const { json, res } = response();

    await UserController.removeFavorite({ user, params: { activityId: '507f1f77bcf86cd799439012' } } as never, res as never);

    expect(json).toHaveBeenCalledWith({
      success: true,
      message: '\u5df2\u53d6\u6d88\u6536\u85cf',
      data: { favoriteActivityIds: [] }
    });
  });

  it('rejects favorite requests without an authenticated user', async () => {
    const { res } = response();

    await expect(UserController.getFavorites({} as never, res as never))
      .rejects.toMatchObject({ statusCode: 401 });
  });
});
