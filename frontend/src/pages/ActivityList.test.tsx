import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ActivityList from './ActivityList';
import { useActivityCatalog } from '../hooks/useActivityCatalog';
import { useFavorites } from '../hooks/useFavorites';
import { useAppSelector } from '../store/hooks';

vi.mock('../hooks/useActivityCatalog', () => ({ useActivityCatalog: vi.fn() }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: vi.fn() }));
vi.mock('../store/hooks', () => ({ useAppSelector: vi.fn() }));

const activity = {
  _id: 'activity-id', title: '校园夜跑', description: '一起绕操场轻松跑步', category: '跑步',
  location: '东操场', startTime: '2099-08-10T12:00:00.000Z', endTime: '2099-08-10T14:00:00.000Z',
  maxParticipants: 20, currentParticipants: 4, price: 0, images: [], tags: [], status: 'published',
  organizer: { id: 'user-id', username: '组织者', email: 'owner@example.com', role: 'user' },
  participants: [], createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z'
};

const catalogState = {
  activities: [activity], loading: false, error: null, userOrders: [],
  pagination: { current: 1, total: 1, pageSize: 9 }, setPagination: vi.fn(), joining: null,
  joinActivity: vi.fn(), leaveActivity: vi.fn()
};

const renderList = () => render(
  <MemoryRouter initialEntries={['/activities']}>
    <Routes>
      <Route path="/activities" element={<ActivityList />} />
      <Route path="/login" element={<div>登录页面</div>} />
    </Routes>
  </MemoryRouter>
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ActivityList favorites', () => {
  it('takes a guest to login when they try to favorite an activity', () => {
    const toggleFavorite = vi.fn();
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: false } } as never));
    vi.mocked(useActivityCatalog).mockReturnValue(catalogState as never);
    vi.mocked(useFavorites).mockReturnValue({
      favorites: [], favoriteIds: new Set(), loading: false, error: null, mutatingId: null,
      toggleFavorite, reload: vi.fn()
    });

    renderList();
    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));

    expect(screen.getByText('登录页面')).toBeInTheDocument();
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it('shows one retryable error after a favorite action fails', () => {
    const toggleFavorite = vi.fn();
    const reload = vi.fn();
    let favoritesState = {
      favorites: [], favoriteIds: new Set<string>(), loading: false, error: null as string | null,
      mutatingId: null as string | null, toggleFavorite, reload
    };
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: true } } as never));
    vi.mocked(useActivityCatalog).mockReturnValue(catalogState as never);
    vi.mocked(useFavorites).mockImplementation(() => favoritesState);

    const view = renderList();
    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));
    favoritesState = { ...favoritesState, error: '收藏请求失败' };
    view.rerender(
      <MemoryRouter initialEntries={['/activities']}>
        <Routes><Route path="/activities" element={<ActivityList />} /></Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('收藏操作失败');
    expect(screen.getByText('收藏请求失败')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
