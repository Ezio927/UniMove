import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/AppError';
import { OrderService } from './OrderService';

describe('OrderService input boundaries', () => {
  it('rejects an invalid activity ID before creating an order', async () => {
    await expect(OrderService.create('invalid', 'user-id')).rejects.toBeInstanceOf(AppError);
  });

  it('rejects unsupported payment methods before database work', async () => {
    await expect(OrderService.pay(
      '507f1f77bcf86cd799439011', 'user-id', 'cash'
    )).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects an invalid order ID before cancellation', async () => {
    await expect(OrderService.cancel('invalid', 'user-id')).rejects.toBeInstanceOf(AppError);
  });
});
