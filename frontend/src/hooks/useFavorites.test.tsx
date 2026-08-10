import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userAPI } from '../api/user';
import { useFavorites } from './useFavorites';

vi.mock('../api/user', () => ({
  userAPI: {
    getFavorites: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn()
  }
}));

const activity = {
  _id: 'activity-1',
  title: 'Campus Run',
  description: 'A friendly campus run.',
  category: 'sports',
  location: 'Campus',
  startTime: '2026-08-10T08:00:00.000Z',
  endTime: '2026-08-10T10:00:00.000Z',
  maxParticipants: 20,
  currentParticipants: 4,
  price: 0,
  images: [],
  organizer: { id: 'organizer-1', username: 'Organizer', email: 'organizer@example.com', role: 'user' as const },
  participants: [],
  status: 'published' as const,
  tags: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z'
};

describe('useFavorites', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads favorites and exposes their IDs', async () => {
    vi.mocked(userAPI.getFavorites).mockResolvedValue({
      success: true,
      data: { activities: [activity] }
    });

    const { result } = renderHook(() => useFavorites(true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.favorites).toEqual([activity]);
    expect(result.current.favoriteIds.has(activity._id)).toBe(true);
  });

  it('adds an unfavorited activity after the request succeeds', async () => {
    vi.mocked(userAPI.getFavorites)
      .mockResolvedValueOnce({ success: true, data: { activities: [] } })
      .mockResolvedValueOnce({ success: true, data: { activities: [activity] } });
    vi.mocked(userAPI.addFavorite).mockResolvedValue({ success: true, data: { favoriteActivityIds: [activity._id] } });
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(activity._id);
    });

    expect(userAPI.addFavorite).toHaveBeenCalledWith(activity._id);
    expect(result.current.favoriteIds.has(activity._id)).toBe(true);
    expect(result.current.mutatingId).toBeNull();
  });

  it('does not load favorites while disabled', async () => {
    const { result } = renderHook(() => useFavorites(false));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.favorites).toEqual([]);
    expect(result.current.favoriteIds.size).toBe(0);
    expect(userAPI.getFavorites).not.toHaveBeenCalled();
  });

  it('prevents a second toggle while the first request is pending', async () => {
    let resolveFavorite: (value: { success: boolean; data: { favoriteActivityIds: string[] } }) => void;
    const addFavorite = new Promise<{ success: boolean; data: { favoriteActivityIds: string[] } }>(resolve => {
      resolveFavorite = resolve;
    });
    vi.mocked(userAPI.getFavorites)
      .mockResolvedValueOnce({ success: true, data: { activities: [] } })
      .mockResolvedValueOnce({ success: true, data: { activities: [activity] } });
    vi.mocked(userAPI.addFavorite).mockReturnValue(addFavorite);
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.toggleFavorite(activity._id);
      void result.current.toggleFavorite(activity._id);
    });

    await waitFor(() => expect(result.current.mutatingId).toBe(activity._id));
    expect(userAPI.addFavorite).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFavorite!({ success: true, data: { favoriteActivityIds: [activity._id] } });
      await addFavorite;
    });

    await waitFor(() => expect(result.current.mutatingId).toBeNull());
  });

  it('keeps the current favorites and exposes an error when removing fails', async () => {
    vi.mocked(userAPI.getFavorites).mockResolvedValue({
      success: true,
      data: { activities: [activity] }
    });
    vi.mocked(userAPI.removeFavorite).mockRejectedValue(new Error('Unable to remove favorite'));
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(activity._id);
    });

    expect(userAPI.removeFavorite).toHaveBeenCalledWith(activity._id);
    expect(result.current.favoriteIds.has(activity._id)).toBe(true);
    expect(result.current.error).toBe('Unable to remove favorite');
    expect(result.current.mutatingId).toBeNull();
  });
});
