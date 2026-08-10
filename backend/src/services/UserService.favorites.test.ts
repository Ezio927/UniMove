import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { UserService } from './UserService';

type FavoriteMethods = {
  addFavorite: (userId: string, activityId: string) => Promise<unknown>;
  removeFavorite: (userId: string, activityId: string) => Promise<unknown>;
  getFavorites: (userId: string) => Promise<unknown>;
};

const favorites = UserService as typeof UserService & FavoriteMethods;

describe('UserService favorites', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects an invalid activity ID before performing a database operation', async () => {
    await expect(favorites.addFavorite('507f1f77bcf86cd799439011', 'invalid'))
      .rejects.toMatchObject<AppError>({ statusCode: 400 });
  });

  it('adds an existing activity with $addToSet so duplicate requests are idempotent', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const activityId = '507f1f77bcf86cd799439012';
    const activity = { _id: activityId };
    vi.spyOn(Activity, 'findById').mockResolvedValue(activity as never);
    vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId } as never);

    await favorites.addFavorite(userId, activityId);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { $addToSet: { favoriteActivities: activityId } },
      { new: true }
    );
  });

  it('rejects a missing activity before updating the user favorites', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const activityId = '507f1f77bcf86cd799439012';
    vi.spyOn(Activity, 'findById').mockResolvedValue(null);
    const updateFavorite = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId } as never);

    await expect(favorites.addFavorite(userId, activityId))
      .rejects.toMatchObject<AppError>({ statusCode: 404 });
    expect(updateFavorite).not.toHaveBeenCalled();
  });

  it('removes a favorite with $pull so repeated removals remain idempotent', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const activityId = '507f1f77bcf86cd799439012';
    vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId } as never);

    await favorites.removeFavorite(userId, activityId);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { $pull: { favoriteActivities: activityId } },
      { new: true }
    );
  });

  it('rejects an invalid activity ID before attempting to remove a favorite', async () => {
    const updateFavorite = vi.spyOn(User, 'findByIdAndUpdate');

    await expect(favorites.removeFavorite('507f1f77bcf86cd799439011', 'invalid'))
      .rejects.toMatchObject<AppError>({ statusCode: 400 });
    expect(updateFavorite).not.toHaveBeenCalled();
  });

  it('lists only existing favorites whose activities are not cancelled', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const activityIds = ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];
    const activities = [{ _id: activityIds[0], title: '晨跑' }];
    vi.spyOn(User, 'findById').mockResolvedValue({ favoriteActivities: activityIds } as never);
    const activitiesQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue(activities)
    };
    vi.spyOn(Activity, 'find').mockReturnValue(activitiesQuery as never);

    await expect(favorites.getFavorites(userId)).resolves.toEqual(activities);

    expect(Activity.find).toHaveBeenCalledWith({
      _id: { $in: activityIds },
      status: { $ne: 'cancelled' }
    });
  });
});
