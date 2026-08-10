import { describe, expect, it } from 'vitest';
import { parseActivityFilters, serializeActivityFilters } from './activityFilters';

describe('activity filters', () => {
  it('parses safe defaults and clamps invalid pages', () => {
    expect(parseActivityFilters('?page=-2&sortOrder=invalid')).toMatchObject({ page: 1, sortOrder: 'desc' });
  });

  it('serializes active filters', () => {
    expect(serializeActivityFilters({ page: 2, limit: 12, search: '篮球', category: '' }))
      .toBe('page=2&limit=12&search=%E7%AF%AE%E7%90%83');
  });
});
