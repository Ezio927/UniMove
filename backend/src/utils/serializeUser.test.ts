import { describe, expect, it } from 'vitest';
import { serializeUser } from './serializeUser';
import { IUser } from '../models/User';

const user = {
  _id: 'user-id',
  username: 'tester',
  email: 'tester@example.com',
  password: 'secret',
  avatar: 'avatar.png',
  phone: '13800000000',
  role: 'user',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z')
} as unknown as IUser;

describe('serializeUser', () => {
  it('only exposes public fields by default', () => {
    expect(serializeUser(user)).toEqual({
      id: 'user-id',
      username: 'tester',
      email: 'tester@example.com',
      avatar: 'avatar.png',
      phone: '13800000000',
      role: 'user'
    });
  });

  it('optionally includes the creation timestamp', () => {
    expect(serializeUser(user, true)).toHaveProperty('createdAt', user.createdAt);
  });
});
