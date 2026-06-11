/**
 * The Quiet — state for Unplug Mode (QUIET-01, 03 §QuietState).
 * One tap, 1–4 hours (default 2): the app goes dark except one line, and the
 * window ends SILENTLY — no notification, no celebration, nothing. Expiry is
 * therefore observed lazily at read time, never announced.
 */
import { SqlDatabase } from '../../core/storage/ports';
import { toLocalIso } from '../../core/storage/time';

export const UNPLUG_MIN_HOURS = 1;
export const UNPLUG_MAX_HOURS = 4;
export const UNPLUG_DEFAULT_HOURS = 2;

export interface QuietState {
  mode: 'none' | 'unplug' | 'detox' | 'stillness';
  unplugUntil: string | null;
}

export async function startUnplug(db: SqlDatabase, hours: number, now: Date): Promise<QuietState> {
  if (!Number.isFinite(hours) || hours < UNPLUG_MIN_HOURS || hours > UNPLUG_MAX_HOURS) {
    throw new Error(`Unplug lasts ${UNPLUG_MIN_HOURS}–${UNPLUG_MAX_HOURS} hours, got ${hours}.`);
  }
  const until = new Date(now.getTime() + hours * 3600_000);
  await db.execute("UPDATE quiet_state SET mode = 'unplug', unplug_until = ? WHERE id = 1", [
    toLocalIso(until),
  ]);
  return { mode: 'unplug', unplugUntil: toLocalIso(until) };
}

/**
 * Current quiet state; an expired unplug window has already ended (silently),
 * so it is cleared on read and reported as 'none'.
 */
export async function getQuietState(db: SqlDatabase, now: Date): Promise<QuietState> {
  const result = await db.execute('SELECT mode, unplug_until FROM quiet_state WHERE id = 1');
  const row = result.rows[0];
  const state: QuietState = {
    mode: (row?.mode as QuietState['mode']) ?? 'none',
    unplugUntil: row?.unplug_until ? String(row.unplug_until) : null,
  };
  // Compare on the epoch — string comparison would break across a DST shift.
  if (state.mode === 'unplug' && state.unplugUntil !== null && now.getTime() >= new Date(state.unplugUntil).getTime()) {
    await db.execute("UPDATE quiet_state SET mode = 'none', unplug_until = NULL WHERE id = 1");
    return { mode: 'none', unplugUntil: null };
  }
  return state;
}

export async function isUnplugged(db: SqlDatabase, now: Date): Promise<boolean> {
  return (await getQuietState(db, now)).mode === 'unplug';
}
