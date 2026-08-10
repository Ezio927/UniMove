import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/AppError';
import { buildActivityCatalogQuery } from './activityQuery';

describe('buildActivityCatalogQuery', () => {
  it('uses safe defaults and caps the page size', () => {
    expect(buildActivityCatalogQuery({ page: '-2', limit: '1000', sortBy: '$where' })).toMatchObject({
      page: 1, limit: 100, skip: 0, sort: { createdAt: -1 }
    });
  });

  it('escapes regular expression syntax in user input', () => {
    const { query } = buildActivityCatalogQuery({ search: 'sport.*', location: '(gym)' });
    expect(query.$or?.[0]).toEqual({ title: { $regex: 'sport\\.\\*', $options: 'i' } });
    expect(query.location).toEqual({ $regex: '\\(gym\\)', $options: 'i' });
  });

  it('builds validated ranges and an allowed sort', () => {
    const result = buildActivityCatalogQuery({
      page: '2', limit: '12', minPrice: '5', maxPrice: '20',
      startDate: '2026-08-01', endDate: '2026-08-31', sortBy: 'price', sortOrder: 'asc'
    });
    expect(result).toMatchObject({ page: 2, limit: 12, skip: 12, sort: { price: 1 } });
    expect(result.query.price).toEqual({ $gte: 5, $lte: 20 });
  });

  it('rejects invalid or reversed ranges', () => {
    expect(() => buildActivityCatalogQuery({ startDate: 'invalid' })).toThrow(AppError);
    expect(() => buildActivityCatalogQuery({ minPrice: '20', maxPrice: '5' })).toThrow(AppError);
  });
});
