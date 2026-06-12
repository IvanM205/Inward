/**
 * Due-compass rule for the Threshold (THR-01, ADR-004): which compass door
 * is open right now. The morning compass is due from its hour until the
 * evening hour; the evening compass from its hour until midnight. Each rests
 * once answered for the day, returning the screen to its one quiet line —
 * nothing on the Threshold asks twice.
 */
import { SqlDatabase } from '../../core/storage/ports';
import { Profile } from '../../core/storage/repos/profileRepo';
import { reflectionForDate } from '../../core/storage/repos/reflectionRepo';
import { localDateKey } from '../../core/storage/time';

export type CompassSlot = 'morning' | 'evening' | null;

function minutesOf(hour: string): number {
  const [h, m] = hour.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Pure rule: hours and done-markers in, due slot out. `eveningDone` means a
 * Reflection row exists for today — the record THR-03 already keeps, so the
 * evening needs no marker of its own.
 */
export function dueCompass(profile: Profile, eveningDone: boolean, now: Date): CompassSlot {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= minutesOf(profile.eveningHour)) {
    return eveningDone ? null : 'evening';
  }
  if (minutes >= minutesOf(profile.morningHour)) {
    return profile.morningDoneDate === localDateKey(now) ? null : 'morning';
  }
  return null;
}

/** Reads today's evening state and applies the rule. */
export async function dueCompassToday(
  db: SqlDatabase,
  profile: Profile,
  now: Date,
): Promise<CompassSlot> {
  const eveningDone = (await reflectionForDate(db, localDateKey(now))) !== null;
  return dueCompass(profile, eveningDone, now);
}
