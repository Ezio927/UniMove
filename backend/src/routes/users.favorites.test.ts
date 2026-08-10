import express, { RequestHandler } from 'express';
import { once } from 'node:events';
import { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';

const controller = vi.hoisted(() => ({
  addFavorite: (_req: unknown, res: { json: (body: unknown) => void }) => res.json({ endpoint: 'add' }),
  changePassword: vi.fn(),
  getFavorites: (_req: unknown, res: { json: (body: unknown) => void }) => res.json({ endpoint: 'list' }),
  getProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  removeFavorite: (_req: unknown, res: { json: (body: unknown) => void }) => res.json({ endpoint: 'remove' }),
  updateProfile: vi.fn()
}));

vi.mock('../controllers/UserController', () => ({ UserController: controller }));
vi.mock('../middleware/auth', () => ({
  authenticateToken: ((_req, _res, next) => next()) as RequestHandler
}));

import userRoutes from './users';

describe('favorite routes', () => {
  it.each([
    ['GET', '/api/users/favorites', 'list'],
    ['PUT', '/api/users/favorites/507f1f77bcf86cd799439012', 'add'],
    ['DELETE', '/api/users/favorites/507f1f77bcf86cd799439012', 'remove']
  ])('dispatches %s %s to the %s favorite handler', async (method, path, endpoint) => {
    const app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;

    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, { method });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ endpoint });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
