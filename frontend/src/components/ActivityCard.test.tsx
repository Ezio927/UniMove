import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ActivityCard, { type ActivityCardProps } from './ActivityCard';
import type { Activity } from '../api/activity';

const activity: Activity = {
  _id: 'activity-id', title: '校园夜跑', description: '一起绕操场轻松跑步', category: '跑步',
  location: '东操场', startTime: '2099-08-10T12:00:00.000Z', endTime: '2099-08-10T14:00:00.000Z',
  maxParticipants: 20, currentParticipants: 4, price: 0, images: [], tags: [], status: 'published',
  organizer: { id: 'user-id', username: '组织者', email: 'owner@example.com', role: 'user' },
  participants: [], createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z'
};

const renderCard = (overrides: Partial<Activity> = {}, props: Partial<ActivityCardProps> = {}) => render(
  <MemoryRouter><ActivityCard activity={{ ...activity, ...overrides }} {...props} /></MemoryRouter>
);

afterEach(cleanup);

describe('ActivityCard', () => {
  it('announces and toggles an unfavorited activity', () => {
    const onToggleFavorite = vi.fn();
    renderCard({}, { isFavorite: false, onToggleFavorite });

    fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));

    expect(onToggleFavorite).toHaveBeenCalledWith(activity._id);
  });

  it('announces the active favorite state', () => {
    renderCard({}, { isFavorite: true, onToggleFavorite: vi.fn() });

    expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument();
  });

  it('presents the essential activity information', () => {
    renderCard();
    expect(screen.getByText('校园夜跑')).toBeInTheDocument();
    expect(screen.getByText('东操场')).toBeInTheDocument();
    expect(screen.getByText('免费')).toBeInTheDocument();
  });

  it('disables enrollment when the activity is full', () => {
    renderCard({ currentParticipants: 20 });
    expect(screen.getByRole('button', { name: '名额已满' })).toBeDisabled();
  });
});
