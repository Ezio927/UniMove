import { AddressInfo } from 'node:net';
import express from 'express';
import mongoose from 'mongoose';
import { afterEach, describe, expect, it } from 'vitest';
import routes from './index';

const originalReadyState = mongoose.connection.readyState;

const requestHealth = async () => {
  const app = express();
  app.use('/api', routes);
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });

  try {
    const { port } = server.address() as AddressInfo;
    return await fetch(`http://127.0.0.1:${port}/api/health`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
};

afterEach(() => {
  mongoose.connection.readyState = originalReadyState;
});

describe('health route', () => {
  it('returns 200 and success true while MongoDB is connected', async () => {
    mongoose.connection.readyState = 1;

    const response = await requestHealth();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      database: { status: 'connected' }
    });
  });

  it('returns 503 and success false while MongoDB is disconnected', async () => {
    mongoose.connection.readyState = 0;

    const response = await requestHealth();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      success: false,
      database: { status: 'disconnected' }
    });
  });
});
