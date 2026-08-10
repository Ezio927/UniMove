import { describe, expect, it } from 'vitest';
import { parseOrderListQuery } from './orderQuery';

describe('parseOrderListQuery', () => {
  it('accepts known statuses and capped pagination', () => {
    expect(parseOrderListQuery({ page: '2', limit: '200', status: 'paid' }))
      .toEqual({ page: 2, limit: 100, skip: 100, status: 'paid' });
  });

  it('ignores unknown statuses', () => {
    expect(parseOrderListQuery({ status: '$ne' }).status).toBeUndefined();
  });
});
