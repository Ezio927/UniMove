import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Profile from './Profile';
import { useProfile } from '../hooks/useProfile';
import { useFavorites } from '../hooks/useFavorites';

vi.mock('../hooks/useProfile', () => ({ useProfile: vi.fn() }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: vi.fn() }));

const user = {
  id: 'user-id', username: '测试用户', email: 'user@example.com', role: 'user',
  createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z'
};

const activity = {
  _id: 'activity-id', title: '校园夜跑', description: '一起绕操场轻松跑步', category: '跑步',
  location: '东操场', startTime: '2099-08-10T12:00:00.000Z', endTime: '2099-08-10T14:00:00.000Z',
  maxParticipants: 20, currentParticipants: 4, price: 0, images: [], tags: [], status: 'published',
  organizer: { id: 'owner-id', username: '组织者', email: 'owner@example.com', role: 'user' },
  participants: [], createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z'
};

const profileState = {
  user, editModalVisible: false, setEditModalVisible: vi.fn(), loading: false, orders: [], comments: [],
  ordersLoading: false, commentsLoading: false, editCommentModalVisible: false,
  setEditCommentModalVisible: vi.fn(), setEditingComment: vi.fn(), form: undefined, commentForm: undefined,
  handleCancelOrder: vi.fn(), handleEditComment: vi.fn(), handleDeleteComment: vi.fn(),
  handleUpdateComment: vi.fn(), handleUpdateProfile: vi.fn()
};

const renderFavorites = (favoritesState: ReturnType<typeof useFavorites>) => {
  vi.mocked(useProfile).mockReturnValue(profileState as never);
  vi.mocked(useFavorites).mockReturnValue(favoritesState);
  render(<MemoryRouter><Profile /></MemoryRouter>);
  fireEvent.click(screen.getByRole('tab', { name: /我的收藏/ }));
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Profile favorites', () => {
  it('announces that favorites are loading', () => {
    renderFavorites({
      favorites: [], favoriteIds: new Set(), loading: true, error: null, mutatingId: null,
      toggleFavorite: vi.fn(), reload: vi.fn()
    });
    expect(screen.getByRole('status', { name: '正在加载收藏活动' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no favorites', () => {
    renderFavorites({
      favorites: [], favoriteIds: new Set(), loading: false, error: null, mutatingId: null,
      toggleFavorite: vi.fn(), reload: vi.fn()
    });
    expect(screen.getByText('暂无收藏活动')).toBeInTheDocument();
  });

  it('renders favorite activities with removal enabled', () => {
    renderFavorites({
      favorites: [activity as never], favoriteIds: new Set([activity._id]), loading: false, error: null,
      mutatingId: null, toggleFavorite: vi.fn(), reload: vi.fn()
    });
    expect(screen.getByRole('button', { name: activity.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument();
  });

  it('shows a retryable error when favorites fail to load', () => {
    const reload = vi.fn();
    renderFavorites({
      favorites: [], favoriteIds: new Set(), loading: false, error: '收藏加载失败详情', mutatingId: null,
      toggleFavorite: vi.fn(), reload
    });
    expect(screen.getByRole('alert')).toHaveTextContent('收藏加载失败详情');
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('labels a failed favorite removal as an action error', () => {
    const toggleFavorite = vi.fn();
    let favoritesState = {
      favorites: [activity as never], favoriteIds: new Set([activity._id]), loading: false,
      error: null as string | null, mutatingId: null as string | null, toggleFavorite, reload: vi.fn()
    };
    vi.mocked(useProfile).mockReturnValue(profileState as never);
    vi.mocked(useFavorites).mockImplementation(() => favoritesState);
    const view = render(<MemoryRouter><Profile /></MemoryRouter>);
    fireEvent.click(screen.getByRole('tab', { name: /我的收藏/ }));
    fireEvent.click(screen.getByRole('button', { name: '取消收藏' }));
    favoritesState = { ...favoritesState, error: '取消收藏失败' };
    view.rerender(<MemoryRouter><Profile /></MemoryRouter>);

    expect(screen.getByRole('alert')).toHaveTextContent('收藏操作失败');
    expect(screen.getByText('取消收藏失败')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('button', { name: activity.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument();
  });
});
