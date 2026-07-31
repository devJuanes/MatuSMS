import type { MessageSendSchedule } from '@matusms/shared';

export function isWithinSchedule(
  schedule: MessageSendSchedule,
  at: Date = new Date(),
): boolean {
  if (!schedule.windows.length) return true;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(at);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayMap[weekday] ?? at.getUTCDay();
  const minuteOfDay = hour * 60 + minute;

  return schedule.windows.some(
    (w) =>
      w.day_of_week === dayOfWeek &&
      minuteOfDay >= w.start_minute &&
      minuteOfDay <= w.end_minute,
  );
}

export function nextScheduleOpenTime(
  schedule: MessageSendSchedule,
  from: Date = new Date(),
): Date | null {
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    if (isWithinSchedule(schedule, candidate)) return candidate;
  }
  return null;
}
