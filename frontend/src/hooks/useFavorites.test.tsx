import { act, render, renderHook, waitFor } from '@testing-library/react';
import { Suspense, startTransition, useLayoutEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userAPI } from '../api/user';
import type { Activity } from '../api/activity';
import { useFavorites } from './useFavorites';

vi.mock('../api/user', () => ({
  userAPI: {
    getFavorites: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn()
  }
}));

const activity: Activity = {
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
  organizer: { _id: 'organizer-1', username: 'Organizer', email: 'organizer@example.com' },
  participants: [],
  status: 'published',
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
    expect(result.current.ready).toBe(true);
  });

  it('does not mutate while the initial favorites request is pending', async () => {
    let resolveFavorites: (value: { success: boolean; data: { activities: typeof activity[] } }) => void;
    const getFavorites = new Promise<{ success: boolean; data: { activities: typeof activity[] } }>(resolve => {
      resolveFavorites = resolve;
    });
    vi.mocked(userAPI.getFavorites).mockReturnValue(getFavorites);
    vi.mocked(userAPI.addFavorite).mockResolvedValue({ success: true, data: { favoriteActivityIds: [activity._id] } });
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.loading).toBe(true));

    act(() => {
      void result.current.toggleFavorite(activity._id);
    });

    expect(userAPI.addFavorite).not.toHaveBeenCalled();
    expect(userAPI.removeFavorite).not.toHaveBeenCalled();
    expect(result.current.ready).toBe(false);
    expect(result.current.errorKind).toBeNull();
    await act(async () => {
      resolveFavorites!({ success: true, data: { activities: [] } });
      await getFavorites;
    });
  });

  it('does not mutate after the initial favorites request fails', async () => {
    vi.mocked(userAPI.getFavorites).mockRejectedValue(new Error('Unable to load favorites'));
    vi.mocked(userAPI.addFavorite).mockResolvedValue({ success: true, data: { favoriteActivityIds: [activity._id] } });
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.error).toBe('Unable to load favorites'));

    await act(async () => {
      await result.current.toggleFavorite(activity._id);
    });

    expect(userAPI.addFavorite).not.toHaveBeenCalled();
    expect(userAPI.removeFavorite).not.toHaveBeenCalled();
    expect(result.current.ready).toBe(false);
    expect(result.current.errorKind).toBe('load');
  });

  it('uses the initialized favorite IDs when an older toggle callback runs', async () => {
    let resolveFavorites: (value: { success: boolean; data: { activities: typeof activity[] } }) => void;
    const getFavorites = new Promise<{ success: boolean; data: { activities: typeof activity[] } }>(resolve => {
      resolveFavorites = resolve;
    });
    vi.mocked(userAPI.getFavorites)
      .mockReturnValueOnce(getFavorites)
      .mockResolvedValueOnce({ success: true, data: { activities: [] } });
    vi.mocked(userAPI.removeFavorite).mockResolvedValue({ success: true, data: { favoriteActivityIds: [] } });
    const { result } = renderHook(() => useFavorites(true));
    const pendingToggle = result.current.toggleFavorite;

    await act(async () => {
      resolveFavorites!({ success: true, data: { activities: [activity] } });
      await getFavorites;
    });
    await waitFor(() => expect(result.current.favoriteIds.has(activity._id)).toBe(true));

    await act(async () => {
      await pendingToggle(activity._id);
    });

    expect(userAPI.removeFavorite).toHaveBeenCalledWith(activity._id);
    expect(userAPI.addFavorite).not.toHaveBeenCalled();
  });

  it('blocks an older ready toggle callback while reload is pending', async () => {
    let resolveReload: (value: { success: boolean; data: { activities: typeof activity[] } }) => void;
    const reloadRequest = new Promise<{ success: boolean; data: { activities: typeof activity[] } }>(resolve => {
      resolveReload = resolve;
    });
    vi.mocked(userAPI.getFavorites)
      .mockResolvedValueOnce({ success: true, data: { activities: [activity] } })
      .mockReturnValueOnce(reloadRequest);
    vi.mocked(userAPI.removeFavorite).mockResolvedValue({ success: true, data: { favoriteActivityIds: [] } });
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.favoriteIds.has(activity._id)).toBe(true));
    const readyToggle = result.current.toggleFavorite;

    act(() => {
      void result.current.reload();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));
    await act(async () => {
      await readyToggle(activity._id);
    });

    expect(userAPI.addFavorite).not.toHaveBeenCalled();
    expect(userAPI.removeFavorite).not.toHaveBeenCalled();
    expect(result.current.ready).toBe(false);
    await act(async () => {
      resolveReload!({ success: true, data: { activities: [activity] } });
      await reloadRequest;
    });
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
    expect(result.current.errorKind).toBe('mutation');
    expect(result.current.mutatingId).toBeNull();
  });

  it('keeps favorites and exposes an error when a removal reports success false', async () => {
    vi.mocked(userAPI.getFavorites).mockResolvedValue({
      success: true,
      data: { activities: [activity] }
    });
    vi.mocked(userAPI.removeFavorite).mockResolvedValue({
      success: false,
      data: { favoriteActivityIds: [] }
    });
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(activity._id);
    });

    expect(result.current.favoriteIds.has(activity._id)).toBe(true);
    expect(result.current.error).toBe('Failed to update favorites');
    expect(result.current.errorKind).toBe('mutation');
    expect(result.current.mutatingId).toBeNull();
  });

  it('clears a mutation error when reload starts', async () => {
    let resolveReload: (value: { success: boolean; data: { activities: typeof activity[] } }) => void;
    const reloadRequest = new Promise<{ success: boolean; data: { activities: typeof activity[] } }>(resolve => {
      resolveReload = resolve;
    });
    vi.mocked(userAPI.getFavorites)
      .mockResolvedValueOnce({ success: true, data: { activities: [activity] } })
      .mockReturnValueOnce(reloadRequest);
    vi.mocked(userAPI.removeFavorite).mockRejectedValue(new Error('Unable to remove favorite'));
    const { result } = renderHook(() => useFavorites(true));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.toggleFavorite(activity._id);
    });

    act(() => {
      void result.current.reload();
    });

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.errorKind).toBeNull();
    expect(result.current.ready).toBe(false);
    await act(async () => {
      resolveReload!({ success: true, data: { activities: [activity] } });
      await reloadRequest;
    });
  });

  it('discards favorites returned by a request that finishes after disabling', async () => {
    let resolveFavorites: (value: { success: boolean; data: { activities: typeof activity[] } }) => void;
    const getFavorites = new Promise<{ success: boolean; data: { activities: typeof activity[] } }>(resolve => {
      resolveFavorites = resolve;
    });
    vi.mocked(userAPI.getFavorites).mockReturnValue(getFavorites);
    const { result, rerender } = renderHook(({ enabled }) => useFavorites(enabled), {
      initialProps: { enabled: true }
    });

    await waitFor(() => expect(result.current.loading).toBe(true));
    rerender({ enabled: false });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      resolveFavorites!({ success: true, data: { activities: [activity] } });
      await getFavorites;
    });

    expect(result.current.favorites).toEqual([]);
    expect(result.current.favoriteIds.size).toBe(0);
  });

  it('does not reload favorites when a pending mutation finishes after disabling', async () => {
    let resolveFavorite: (value: { success: boolean; data: { favoriteActivityIds: string[] } }) => void;
    const addFavorite = new Promise<{ success: boolean; data: { favoriteActivityIds: string[] } }>(resolve => {
      resolveFavorite = resolve;
    });
    vi.mocked(userAPI.getFavorites).mockResolvedValue({ success: true, data: { activities: [] } });
    vi.mocked(userAPI.addFavorite).mockReturnValue(addFavorite);
    const { result, rerender } = renderHook(({ enabled }) => useFavorites(enabled), {
      initialProps: { enabled: true }
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.toggleFavorite(activity._id);
    });
    await waitFor(() => expect(result.current.mutatingId).toBe(activity._id));
    rerender({ enabled: false });

    await act(async () => {
      resolveFavorite!({ success: true, data: { favoriteActivityIds: [activity._id] } });
      await addFavorite;
    });

    await waitFor(() => expect(result.current.mutatingId).toBeNull());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.favoriteIds.size).toBe(0);
    expect(userAPI.getFavorites).toHaveBeenCalledTimes(1);
  });

  it('keeps an active request when a disabling render is interrupted before commit', async () => {
    let resolveFavorites: (value: { success: boolean; data: { activities: typeof activity[] } }) => void;
    let setEnabled: (enabled: boolean) => void;
    let suspended = false;
    const getFavorites = new Promise<{ success: boolean; data: { activities: typeof activity[] } }>(resolve => {
      resolveFavorites = resolve;
    });
    const pendingRender = new Promise<never>(() => undefined);
    vi.mocked(userAPI.getFavorites).mockReturnValue(getFavorites);

    const Harness = () => {
      const [enabled, setEnabledState] = useState(true);
      setEnabled = setEnabledState;
      const { favorites, loading } = useFavorites(enabled);
      if (!enabled) {
        suspended = true;
        throw pendingRender;
      }
      return <span data-testid="favorites-state">{loading ? 'loading' : favorites.map(item => item._id).join(',')}</span>;
    };
    const { getByTestId } = render(<Suspense fallback={<span>fallback</span>}><Harness /></Suspense>);
    await waitFor(() => expect(getByTestId('favorites-state')).toHaveTextContent('loading'));

    act(() => {
      startTransition(() => setEnabled!(false));
    });
    await waitFor(() => expect(suspended).toBe(true));
    act(() => {
      setEnabled!(true);
    });

    await act(async () => {
      resolveFavorites!({ success: true, data: { activities: [activity] } });
      await getFavorites;
    });

    await waitFor(() => expect(getByTestId('favorites-state')).toHaveTextContent(activity._id));
  });

  it('blocks a stale reload in the layout phase of a committed disable', async () => {
    let setEnabled: (enabled: boolean) => void;
    let enabledReload: (() => Promise<void>) | undefined;
    vi.mocked(userAPI.getFavorites).mockResolvedValue({ success: true, data: { activities: [] } });

    const Harness = () => {
      const [enabled, setEnabledState] = useState(true);
      setEnabled = setEnabledState;
      const { favorites, reload } = useFavorites(enabled);
      if (enabled) enabledReload = reload;
      useLayoutEffect(() => {
        if (!enabled) void enabledReload!();
      }, [enabled]);
      return <span data-testid="disabled-favorites-state">{favorites.length}</span>;
    };
    const { getByTestId } = render(<Harness />);
    await waitFor(() => expect(userAPI.getFavorites).toHaveBeenCalledTimes(1));

    act(() => {
      setEnabled!(false);
    });

    await waitFor(() => expect(getByTestId('disabled-favorites-state')).toHaveTextContent('0'));
    expect(userAPI.getFavorites).toHaveBeenCalledTimes(1);
  });

  it('blocks a stale toggle in the layout phase of a committed disable', async () => {
    let setEnabled: (enabled: boolean) => void;
    let enabledToggle: ((activityId: string) => Promise<void>) | undefined;
    vi.mocked(userAPI.getFavorites).mockResolvedValue({ success: true, data: { activities: [] } });
    vi.mocked(userAPI.addFavorite).mockRejectedValue(new Error('must not run'));

    const Harness = () => {
      const [enabled, setEnabledState] = useState(true);
      setEnabled = setEnabledState;
      const { error, toggleFavorite } = useFavorites(enabled);
      if (enabled) enabledToggle = toggleFavorite;
      useLayoutEffect(() => {
        if (!enabled) void enabledToggle!(activity._id);
      }, [enabled]);
      return <span data-testid="disabled-favorites-error">{error ?? 'none'}</span>;
    };
    const { getByTestId } = render(<Harness />);
    await waitFor(() => expect(userAPI.getFavorites).toHaveBeenCalledTimes(1));

    act(() => {
      setEnabled!(false);
    });

    await waitFor(() => expect(getByTestId('disabled-favorites-error')).toHaveTextContent('none'));
    expect(userAPI.addFavorite).not.toHaveBeenCalled();
    expect(userAPI.removeFavorite).not.toHaveBeenCalled();
    expect(userAPI.getFavorites).toHaveBeenCalledTimes(1);
  });
});
