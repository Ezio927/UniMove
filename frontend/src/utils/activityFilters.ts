import type { ActivityFilters } from '../api/activity';

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  page: 1, limit: 12, search: '', category: '', location: '',
  sortBy: 'createdAt', sortOrder: 'desc'
};

export const parseActivityFilters = (search: string): ActivityFilters => {
  const params = new URLSearchParams(search);
  const sortOrder = params.get('sortOrder');
  return {
    ...DEFAULT_ACTIVITY_FILTERS,
    page: Math.max(1, Number(params.get('page')) || 1),
    search: params.get('search') || '',
    category: params.get('category') || '',
    location: params.get('location') || '',
    sortBy: params.get('sortBy') || 'createdAt',
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
  };
};

export const serializeActivityFilters = (filters: ActivityFilters): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) params.set(key, String(value));
  });
  return params.toString();
};
