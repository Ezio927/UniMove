import { describe, expect, it, vi } from 'vitest';

const { addFavorite, getFavorites, removeFavorite } = vi.hoisted(() => ({
  addFavorite: vi.fn().mockResolvedValue(undefined),
  getFavorites: vi.fn().mockResolvedValue([{ _id: 'activity-1', title: '晨跑' }]),
  removeFavorite: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../services/UserService', () => ({
  UserService: { addFavorite, getFavorites, removeFavorite }
}));

import { UserController } from './UserController';

type FavoriteControllerMethods = {
  addFavorite: (req: { params: { activityId: string }; user?: { userId: string } }, res: ResponseDouble) => Promise<void>;
  getFavorites: (req: { user?: { userId: string } }, res: ResponseDouble) => Promise<void>;
  removeFavorite: (req: { params: { activityId: string }; user?: { userId: string } }, res: ResponseDouble) => Promise<void>;
};

type ResponseDouble = {
  json: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
};

const favorites = UserController as typeof UserController & FavoriteControllerMethods;

describe('UserController favorites', () => {
  it('returns the authenticated user favorites in the standard response envelope', async () => {
    const res: ResponseDouble = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    await favorites.getFavorites({ user: { userId: 'user-1' } }, res);

    expect(getFavorites).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { activities: [{ _id: 'activity-1', title: '晨跑' }] }
    });
  });

  it('adds a favorite for the authenticated user without accepting another user ID', async () => {
    const res: ResponseDouble = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    await favorites.addFavorite({
      params: { activityId: '507f1f77bcf86cd799439012' },
      user: { userId: 'user-1' }
    }, res);

    expect(addFavorite).toHaveBeenCalledWith('user-1', '507f1f77bcf86cd799439012');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: '收藏成功' });
  });

  it('removes a favorite for the authenticated user', async () => {
    const res: ResponseDouble = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    await favorites.removeFavorite({
      params: { activityId: '507f1f77bcf86cd799439012' },
      user: { userId: 'user-1' }
    }, res);

    expect(removeFavorite).toHaveBeenCalledWith('user-1', '507f1f77bcf86cd799439012');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: '取消收藏成功' });
  });
});
