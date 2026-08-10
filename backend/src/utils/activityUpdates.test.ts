import { describe, expect, it } from 'vitest';
import { hasLockedActivityUpdates, pickActivityUpdates } from './activityUpdates';

describe('activity update sanitization', () => {
  it('drops ownership and enrollment fields', () => {
    expect(pickActivityUpdates({
      title: '羽毛球', organizer: 'attacker', participants: ['attacker'],
      currentParticipants: 999
    })).toEqual({ title: '羽毛球' });
  });

  it('detects fields locked after enrollment', () => {
    expect(hasLockedActivityUpdates({ title: '新标题' })).toBe(false);
    expect(hasLockedActivityUpdates({ price: 20 })).toBe(true);
  });
});
