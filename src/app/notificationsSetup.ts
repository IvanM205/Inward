/**
 * Wires the two compass lines (NTF-01) to the person's chosen hours.
 * Lines come from the public persuasion/ directory (NFR-P5) — what is
 * published is exactly what is pushed. Silent by default (INV-4); the
 * optional bowl tone becomes a setting later.
 */
import notificationLines from '../../persuasion/notifications.json';
import { NotificationScheduler } from '../core/notifications/scheduler';
import { SqlDatabase } from '../core/storage/ports';
import { getProfile } from '../core/storage/repos/profileRepo';

function parseHour(hourMinute: string): { hour: number; minute: number } {
  const [hour, minute] = hourMinute.split(':').map(Number);
  return { hour, minute };
}

export async function enableCompassLines(
  db: SqlDatabase,
  scheduler: NotificationScheduler,
): Promise<void> {
  const profile = await getProfile(db);
  if (!profile) return;
  await scheduler.enable('morning', {
    ...parseHour(profile.morningHour),
    line: notificationLines.morning,
    sound: false,
  });
  await scheduler.enable('evening', {
    ...parseHour(profile.eveningHour),
    line: notificationLines.evening,
    sound: false,
  });
}
