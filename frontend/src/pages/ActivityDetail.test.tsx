import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ActivityDetail from './ActivityDetail';
import { useActivityDetail } from '../hooks/useActivityDetail';
import { useFavorites } from '../hooks/useFavorites';
import { useAppSelector } from '../store/hooks';
import type { Activity } from '../api/activity';

vi.mock('../hooks/useActivityDetail', () => ({ useActivityDetail: vi.fn() }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: vi.fn() }));
vi.mock('../store/hooks', () => ({ useAppSelector: vi.fn() }));

const activity: Activity = {
  _id: 'activity-id', title: '校园夜跑', description: '一起绕操场轻松跑步', category: '跑步',
  location: '东操场', startTime: '2099-08-10T12:00:00.000Z', endTime: '2099-08-10T14:00:00.000Z',
  maxParticipants: 20, currentParticipants: 4, price: 0, images: [], tags: [], status: 'published',
  organizer: { _id: 'user-id', username: '组织者', email: 'owner@example.com' },
  participants: [], createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z'
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ActivityDetail', () => {
  it('lets an authenticated organizer favorite their own activity', () => {
    const toggleFavorite = vi.fn();
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: true } } as never));
    vi.mocked(useFavorites).mockReturnValue({
      favorites: [], favoriteIds: new Set(), loading: false, ready: true, error: null, errorKind: null,
      mutatingId: null, toggleFavorite, reload: vi.fn()
    });
    vi.mocked(useActivityDetail).mockReturnValue({
      activity, comments: [], statistics: null, loading: false, commentsLoading: false, error: null,
      enrolling: false, cancelling: false, commentModalVisible: false, setCommentModalVisible: vi.fn(),
      commentLoading: false, userEnrollmentStatus: false, canComment: false, isOrganizer: true,
      form: undefined, handleEnroll: vi.fn(), handleCancelEnrollment: vi.fn(), handleComment: vi.fn(), retry: vi.fn()
    } as never);

    render(<MemoryRouter><ActivityDetail /></MemoryRouter>);

    expect(screen.getByText('这是你创建的活动')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '立即报名' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '已报名' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '取消报名' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));
    expect(toggleFavorite).toHaveBeenCalledWith(activity._id);
  });

  it('does not toggle while the authenticated favorite state is pending', () => {
    const toggleFavorite = vi.fn();
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: true } } as never));
    vi.mocked(useFavorites).mockReturnValue({
      favorites: [], favoriteIds: new Set(), loading: true, ready: false, error: null, errorKind: null,
      mutatingId: null, toggleFavorite, reload: vi.fn()
    });
    vi.mocked(useActivityDetail).mockReturnValue({
      activity, comments: [], statistics: null, loading: false, commentsLoading: false, error: null,
      enrolling: false, cancelling: false, commentModalVisible: false, setCommentModalVisible: vi.fn(),
      commentLoading: false, userEnrollmentStatus: false, canComment: false, isOrganizer: false,
      form: undefined, handleEnroll: vi.fn(), handleCancelEnrollment: vi.fn(), handleComment: vi.fn(), retry: vi.fn()
    } as never);

    render(<MemoryRouter><ActivityDetail /></MemoryRouter>);
    const favoriteButton = screen.getByRole('button', { name: '收藏活动' });
    expect(favoriteButton).toBeDisabled();
    expect(favoriteButton).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(favoriteButton);
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it('shows one retryable error after a favorite action fails', () => {
    const toggleFavorite = vi.fn();
    const reload = vi.fn();
    let favoritesState = {
      favorites: [], favoriteIds: new Set<string>(), loading: false, ready: true, error: null as string | null,
      errorKind: null as 'load' | 'mutation' | null, mutatingId: null as string | null, toggleFavorite, reload
    };
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: true } } as never));
    vi.mocked(useFavorites).mockImplementation(() => favoritesState);
    vi.mocked(useActivityDetail).mockReturnValue({
      activity, comments: [], statistics: null, loading: false, commentsLoading: false, error: null,
      enrolling: false, cancelling: false, commentModalVisible: false, setCommentModalVisible: vi.fn(),
      commentLoading: false, userEnrollmentStatus: false, canComment: false, isOrganizer: false,
      form: undefined, handleEnroll: vi.fn(), handleCancelEnrollment: vi.fn(), handleComment: vi.fn(), retry: vi.fn()
    } as never);

    const view = render(<MemoryRouter><ActivityDetail /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));
    favoritesState = { ...favoritesState, error: '收藏请求失败', errorKind: 'mutation' };
    view.rerender(<MemoryRouter><ActivityDetail /></MemoryRouter>);

    expect(screen.getByRole('alert')).toHaveTextContent('收藏操作失败');
    expect(screen.getByText('收藏请求失败')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('uses the hook error kind after an earlier favorite action', () => {
    let favoritesState = {
      favorites: [], favoriteIds: new Set<string>(), loading: false, ready: true,
      error: null as string | null, errorKind: null as 'load' | 'mutation' | null,
      mutatingId: null as string | null, toggleFavorite: vi.fn(), reload: vi.fn()
    };
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: true } } as never));
    vi.mocked(useFavorites).mockImplementation(() => favoritesState);
    vi.mocked(useActivityDetail).mockReturnValue({
      activity, comments: [], statistics: null, loading: false, commentsLoading: false, error: null,
      enrolling: false, cancelling: false, commentModalVisible: false, setCommentModalVisible: vi.fn(),
      commentLoading: false, userEnrollmentStatus: false, canComment: false, isOrganizer: false,
      form: undefined, handleEnroll: vi.fn(), handleCancelEnrollment: vi.fn(), handleComment: vi.fn(), retry: vi.fn()
    } as never);
    const view = render(<MemoryRouter><ActivityDetail /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));
    favoritesState = { ...favoritesState, ready: false, error: '重新加载失败', errorKind: 'load' };

    view.rerender(<MemoryRouter><ActivityDetail /></MemoryRouter>);

    expect(screen.getByRole('alert')).toHaveTextContent('收藏加载失败');
  });
});
