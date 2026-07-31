import { describe, it, expect } from 'vitest';
import { isWithinSchedule, nextScheduleOpenTime } from '../src/lib/schedule.js';
import type { MessageSendSchedule } from '@matusms/shared';

const businessHours: MessageSendSchedule = {
  id: '1',
  user_id: 'u1',
  name: 'Business',
  timezone: 'UTC',
  windows: [{ day_of_week: 1, start_minute: 540, end_minute: 1020 }],
  created_at: '',
  updated_at: '',
};

describe('schedule', () => {
  it('allows send within window', () => {
    const monday10am = new Date('2026-06-01T10:00:00Z'); // Monday
    expect(isWithinSchedule(businessHours, monday10am)).toBe(true);
  });

  it('blocks send outside window', () => {
    const monday8pm = new Date('2026-06-01T20:00:00Z');
    expect(isWithinSchedule(businessHours, monday8pm)).toBe(false);
  });

  it('finds next open time', () => {
    const sunday = new Date('2026-05-31T12:00:00Z');
    const next = nextScheduleOpenTime(businessHours, sunday);
    expect(next).not.toBeNull();
  });
});

describe('generateApiKey format', () => {
  it('generates msk_ prefixed keys', async () => {
    const { generateApiKey } = await import('../src/lib/matudb.js');
    const key = generateApiKey();
    expect(key.startsWith('msk_')).toBe(true);
    expect(key.length).toBeGreaterThan(10);
  });
});
