import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ActivityDetail from './ActivityDetail';
import { useActivityDetail } from '../hooks/useActivityDetail';
import { useFavorites } from '../hooks/useFavorites';
import { useAppSelector } from '../store/hooks';

vi.mock('../hooks/useActivityDetail', () => ({ useActivityDetail: vi.fn() }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: vi.fn() }));
vi.mock('../store/hooks', () => ({ useAppSelector: vi.fn() }));

const activity = {
  _id: 'activity-id', title: '校园夜跑', description: '一起绕操场轻松跑步', category: '跑步',
  location: '东操场', startTime: '2099-08-10T12:00:00.000Z', endTime: '2099-08-10T14:00:00.000Z',
  maxParticipants: 20, currentParticipants: 4, price: 0, images: [], tags: [], status: 'published',
  organizer: { id: 'user-id', username: '组织者', email: 'owner@example.com', role: 'user' },
  participants: [], createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z'
};

afterEach(() => vi.clearAllMocks());

describe('ActivityDetail', () => {
  it('lets an authenticated organizer favorite their own activity', () => {
    const toggleFavorite = vi.fn();
    vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { isAuthenticated: true } } as never));
    vi.mocked(useFavorites).mockReturnValue({
      favorites: [], favoriteIds: new Set(), loading: false, error: null, mutatingId: null, toggleFavorite, reload: vi.fn()
    });
    vi.mocked(useActivityDetail).mockReturnValue({
      activity, comments: [], statistics: null, loading: false, commentsLoading: false, error: null,
      enrolling: false, cancelling: false, commentModalVisible: false, setCommentModalVisible: vi.fn(),
      commentLoading: false, userEnrollmentStatus: false, canComment: false, isOrganizer: true,
      form: undefined, handleEnroll: vi.fn(), handleCancelEnrollment: vi.fn(), handleComment: vi.fn(), retry: vi.fn()
    } as never);

    render(<MemoryRouter><ActivityDetail /></MemoryRouter>);

    expect(screen.getByText('这是你创建的活动')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));
    expect(toggleFavorite).toHaveBeenCalledWith(activity._id);
  });
});
