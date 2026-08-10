import { FilterQuery } from 'mongoose';
import { AppError } from '../errors/AppError';
import { IActivity } from '../models/Activity';

export type ActivityQueryInput = Record<string, unknown>;

const SORT_FIELDS = new Set(['createdAt', 'startTime', 'price']);

const stringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDate = (value: string | undefined, field: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(400, `${field} must be a valid date`);
  return date;
};

const parsePrice = (value: string | undefined, field: string): number | undefined => {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(400, `${field} must be a non-negative number`);
  }
  return number;
};

const parsePositiveInteger = (value: unknown, fallback: number, maximum: number) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, maximum);
};

export const buildActivityCatalogQuery = (input: ActivityQueryInput) => {
  const page = parsePositiveInteger(input.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInteger(input.limit, 10, 100);
  const category = stringValue(input.category);
  const location = stringValue(input.location);
  const search = stringValue(input.search);
  const startDate = parseDate(stringValue(input.startDate), 'startDate');
  const endDate = parseDate(stringValue(input.endDate), 'endDate');
  const minPrice = parsePrice(stringValue(input.minPrice), 'minPrice');
  const maxPrice = parsePrice(stringValue(input.maxPrice), 'maxPrice');

  if (startDate && endDate && startDate > endDate) {
    throw new AppError(400, 'startDate must not be later than endDate');
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new AppError(400, 'minPrice must not exceed maxPrice');
  }

  const query: FilterQuery<IActivity> = { status: 'published' };
  if (category) query.category = category;
  if (location) query.location = { $regex: escapeRegExp(location), $options: 'i' };
  if (search) {
    const safeSearch = { $regex: escapeRegExp(search), $options: 'i' };
    query.$or = [
      { title: safeSearch }, { description: safeSearch },
      { category: safeSearch }, { location: safeSearch }
    ];
  }
  if (startDate || endDate) {
    query.startTime = { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {
      ...(minPrice !== undefined && { $gte: minPrice }),
      ...(maxPrice !== undefined && { $lte: maxPrice })
    };
  }

  const requestedSort = stringValue(input.sortBy);
  const sortBy = requestedSort && SORT_FIELDS.has(requestedSort) ? requestedSort : 'createdAt';
  const sortOrder: 1 | -1 = input.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

  return { query, page, limit, skip: (page - 1) * limit, sort };
};
