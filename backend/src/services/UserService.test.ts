import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { UserService } from './UserService';

describe('UserService favorites', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rejects an invalid activity ID before database work', async () => {
    const activitySpy = vi.spyOn(Activity, 'exists');

    await expect(UserService.addFavorite('507f1f77bcf86cd799439011', 'invalid'))
      .rejects.toMatchObject({ statusCode: 400, message: '\u6d3b\u52a8 ID \u65e0\u6548' });

    expect(activitySpy).not.toHaveBeenCalled();
  });

  it('uses addToSet so repeated favorites stay idempotent', async () => {
    vi.spyOn(Activity, 'exists').mockResolvedValue({ _id: '507f1f77bcf86cd799439012' } as never);
    const select = vi.fn().mockResolvedValue({ favoriteActivities: ['507f1f77bcf86cd799439012'] });
    const update = vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ select } as never);

    await UserService.addFavorite('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

    expect(update).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { $addToSet: { favoriteActivities: '507f1f77bcf86cd799439012' } },
      { new: true }
    );
  });

  it('returns 404 for a missing activity without updating the user', async () => {
    vi.spyOn(Activity, 'exists').mockResolvedValue(null);
    const update = vi.spyOn(User, 'findByIdAndUpdate');

    await expect(UserService.addFavorite(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    )).rejects.toMatchObject({ statusCode: 404 });

    expect(update).not.toHaveBeenCalled();
  });

  it('uses pull so repeated removals stay idempotent', async () => {
    const activitySpy = vi.spyOn(Activity, 'exists');
    const select = vi.fn().mockResolvedValue({ favoriteActivities: [] });
    const update = vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ select } as never);

    await UserService.removeFavorite('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

    expect(update).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { $pull: { favoriteActivities: '507f1f77bcf86cd799439012' } },
      { new: true }
    );
    expect(activitySpy).not.toHaveBeenCalled();
  });

  it('returns 404 when the favorite-list user is missing', async () => {
    vi.spyOn(User, 'findById').mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as never);

    await expect(UserService.getFavorites('507f1f77bcf86cd799439011'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns an empty list for a legacy user without a favorites field', async () => {
    vi.spyOn(User, 'findById').mockReturnValue({ select: vi.fn().mockResolvedValue({}) } as never);
    const find = vi.spyOn(Activity, 'find').mockReturnValue({
      sort: vi.fn().mockResolvedValue([])
    } as never);

    await expect(UserService.getFavorites('507f1f77bcf86cd799439011')).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it('returns 404 when the add-favorite user is missing', async () => {
    vi.spyOn(Activity, 'exists').mockResolvedValue({ _id: '507f1f77bcf86cd799439012' } as never);
    vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as never);

    await expect(UserService.addFavorite(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    )).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 404 when the remove-favorite user is missing', async () => {
    vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as never);

    await expect(UserService.removeFavorite(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    )).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns every existing favorite status ordered by activity creation time', async () => {
    const favoriteIds = ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];
    vi.spyOn(User, 'findById').mockReturnValue({ select: vi.fn().mockResolvedValue({ favoriteActivities: favoriteIds }) } as never);
    const activities = [
      {
        _id: favoriteIds[1],
        status: 'completed',
        organizer: { username: 'Organizer B', email: 'b@example.com', avatar: 'b.png' }
      },
      {
        _id: favoriteIds[0],
        status: 'cancelled',
        organizer: { username: 'Organizer A', email: 'a@example.com', avatar: 'a.png' }
      }
    ];
    const sort = vi.fn().mockResolvedValue(activities);
    const populate = vi.fn().mockReturnValue({ sort });
    const find = vi.spyOn(Activity, 'find').mockReturnValue({ populate, sort } as never);

    await expect(UserService.getFavorites('507f1f77bcf86cd799439011')).resolves.toEqual(activities);
    expect(find).toHaveBeenCalledWith({ _id: { $in: favoriteIds } });
    expect(populate).toHaveBeenCalledWith('organizer', 'username email avatar');
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(activities[0].organizer).toEqual({
      username: 'Organizer B',
      email: 'b@example.com',
      avatar: 'b.png'
    });
  });
});
