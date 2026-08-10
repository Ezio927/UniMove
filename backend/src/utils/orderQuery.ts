import { ActivityQueryInput, parsePagination } from './activityQuery';

const ORDER_STATUSES = new Set(['pending', 'paid', 'cancelled', 'refunded']);

export const parseOrderListQuery = (input: ActivityQueryInput) => {
  const pagination = parsePagination(input);
  const status = typeof input.status === 'string' && ORDER_STATUSES.has(input.status)
    ? input.status : undefined;
  return { ...pagination, status };
};
