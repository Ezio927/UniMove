import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { generateToken } from '../utils/jwt';
import userRoutes from './users';

const userId = '507f1f77bcf86cd799439011';
const activityId = '507f1f77bcf86cd799439012';
const authenticatedUser = {
  _id: { toString: () => userId },
  email: 'student@example.com',
  role: 'user',
  isActive: true
};

const request = async (path: string, init?: RequestInit) => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  app.use(errorHandler);
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });

  try {
    const { port } = server.address() as AddressInfo;
    return await fetch(`http://127.0.0.1:${port}${path}`, init);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
};

const authorization = () => {
  vi.spyOn(User, 'findById').mockResolvedValue(authenticatedUser as never);
  return { authorization: `Bearer ${generateToken(authenticatedUser as never)}` };
};

afterEach(() => vi.restoreAllMocks());

describe('favorite user routes', () => {
  it('rejects unauthenticated favorite requests before the service boundary', async () => {
    const service = vi.spyOn(UserService, 'getFavorites');

    const response = await request('/api/users/favorites');

    expect(response.status).toBe(401);
    expect(service).not.toHaveBeenCalled();
  });

  it('passes the authenticated user ID through the GET favorites route', async () => {
    const service = vi.spyOn(UserService, 'getFavorites').mockResolvedValue([] as never);

    const response = await request('/api/users/favorites', { headers: authorization() });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { activities: [] } });
    expect(service).toHaveBeenCalledWith(userId);
  });

  it('passes the path activity ID and authenticated user ID through the PUT route', async () => {
    const service = vi.spyOn(UserService, 'addFavorite').mockResolvedValue([activityId] as never);

    const response = await request(`/api/users/favorites/${activityId}`, {
      method: 'PUT',
      headers: authorization()
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { favoriteActivityIds: [activityId] } });
    expect(service).toHaveBeenCalledWith(userId, activityId);
  });

  it('passes the path activity ID and authenticated user ID through the DELETE route', async () => {
    const service = vi.spyOn(UserService, 'removeFavorite').mockResolvedValue([] as never);

    const response = await request(`/api/users/favorites/${activityId}`, {
      method: 'DELETE',
      headers: authorization()
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { favoriteActivityIds: [] } });
    expect(service).toHaveBeenCalledWith(userId, activityId);
  });
});
