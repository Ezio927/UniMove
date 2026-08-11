import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { importActivities } from './importData';

const originalEnv = { ...process.env };
const originalReadyState = mongoose.connection.readyState;

beforeEach(() => {
  process.env = { ...originalEnv, NODE_ENV: 'development' };
  delete process.env.SEED_ADMIN_PASSWORD;
  mongoose.connection.readyState = 1;

  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(User, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);
  vi.spyOn(Activity, 'deleteMany').mockResolvedValue({} as never);
  vi.spyOn(Activity, 'insertMany').mockResolvedValue([] as never);
});

afterEach(() => {
  process.env = { ...originalEnv };
  mongoose.connection.readyState = originalReadyState;
  vi.restoreAllMocks();
});

describe('demo seed configuration boundary', () => {
  it('rejects a missing process-local admin password before querying users', async () => {
    await expect(importActivities()).rejects.toThrow(/SEED_ADMIN_PASSWORD/);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects an admin password shorter than 12 characters', async () => {
    process.env.SEED_ADMIN_PASSWORD = 'S'.repeat(11);

    await expect(importActivities()).rejects.toThrow(/at least 12/);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects the known legacy demo password', async () => {
    process.env.SEED_ADMIN_PASSWORD = 'password123';

    await expect(importActivities()).rejects.toThrow(/must not use the legacy demo password/);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects demo imports in production even with a strong password', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SEED_ADMIN_PASSWORD = 'S'.repeat(12);

    await expect(importActivities()).rejects.toThrow(/disabled in production/);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('uses the process-local password for a newly seeded local admin', async () => {
    const adminPassword = 'S'.repeat(12);
    let passwordPassedToUser: string | undefined;
    process.env.SEED_ADMIN_PASSWORD = adminPassword;
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.spyOn(User.prototype, 'save').mockImplementation(async function() {
      passwordPassedToUser = this.password;
      return this;
    } as never);

    await importActivities();

    expect(passwordPassedToUser).toBe(adminPassword);
  });
});
