/**
 * The Quiet — state for Unplug Mode (QUIET-01, 03 §QuietState).
 * One tap, 1–4 hours (default 2): the app goes dark except one line, and the
 * window ends SILENTLY — no notification, no celebration, nothing. Expiry is
 * therefore observed lazily at read time, never announced.
 */
import { ChannelKey } from '../../core/scoring/config';
import { SqlDatabase } from '../../core/storage/ports';
import { dateKeyDaysAgo, localDateKey, toLocalIso } from '../../core/storage/time';
import { addEntry } from '../journal/journalRepo';

export const UNPLUG_MIN_HOURS = 1;
export const UNPLUG_MAX_HOURS = 4;
export const UNPLUG_DEFAULT_HOURS = 2;

export interface QuietState {
  mode: 'none' | 'unplug' | 'detox' | 'stillness';
  unplugUntil: string | null;
}

/** QUIET-02 program lengths, in days. */
export const DETOX_PROGRAMS = [7, 14, 30] as const;
export type DetoxProgram = (typeof DETOX_PROGRAMS)[number];

export interface DetoxState {
  program: DetoxProgram;
  startedOn: string;
  redList: ChannelKey[];
  lastCheckinOn: string | null;
}

export interface ActiveDetox {
  state: DetoxState;
  /** 1-based day of the program. */
  dayIndex: number;
  /** Past the final day: only the closing question remains. */
  finished: boolean;
  /** Channels under detox today — the progressive schedule (QUIET-02). */
  focus: ChannelKey[];
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

/**
 * Progressive schedule (QUIET-02, "shorter feeds first"): the red list keeps
 * its canonical order (quick-dopamine channels rank first); the first third
 * of the program detoxes the first channel, the middle third the first two,
 * the final third everything listed.
 */
export function detoxFocus(redList: ChannelKey[], dayIndex: number, program: DetoxProgram): ChannelKey[] {
  if (redList.length <= 1) return [...redList];
  const phase = Math.ceil((dayIndex / program) * 3); // 1..3
  const count = Math.max(1, Math.ceil((redList.length * phase) / 3));
  return redList.slice(0, count);
}

export async function startDetox(
  db: SqlDatabase,
  program: DetoxProgram,
  redList: ChannelKey[],
  now: Date,
): Promise<void> {
  if (redList.length === 0) throw new Error('A detox needs at least one channel on the red list.');
  const state: DetoxState = {
    program,
    startedOn: localDateKey(now),
    redList,
    lastCheckinOn: null,
  };
  await db.execute("UPDATE quiet_state SET mode = 'detox', detox = ? WHERE id = 1", [
    JSON.stringify(state),
  ]);
}

export async function activeDetox(db: SqlDatabase, now: Date): Promise<ActiveDetox | null> {
  const result = await db.execute('SELECT mode, detox FROM quiet_state WHERE id = 1');
  const row = result.rows[0];
  if (row?.mode !== 'detox' || !row.detox) return null;
  const state = JSON.parse(String(row.detox)) as DetoxState;
  // Day index from calendar days elapsed; day 1 is the start day.
  let dayIndex = 1;
  while (dateKeyDaysAgo(now, dayIndex - 1) > state.startedOn && dayIndex <= state.program) {
    dayIndex += 1;
  }
  const finished = dayIndex > state.program;
  return {
    state,
    dayIndex: Math.min(dayIndex, state.program),
    finished,
    focus: detoxFocus(state.redList, Math.min(dayIndex, state.program), state.program),
  };
}

/** The daily one-line check-in — Evidence on the red-list channels (QUIET-02). */
export async function detoxCheckin(db: SqlDatabase, line: string, now: Date): Promise<void> {
  const detox = await activeDetox(db, now);
  if (!detox) throw new Error('No detox is running.');
  await addEntry(
    db,
    { type: 'care', text: line, channelKeys: detox.state.redList, origin: 'auto' },
    now,
  );
  const state: DetoxState = { ...detox.state, lastCheckinOn: localDateKey(now) };
  await db.execute('UPDATE quiet_state SET detox = ? WHERE id = 1', [JSON.stringify(state)]);
}

/**
 * QUIET-03 — the Stillness Switch: one weekly protected window, designed
 * once. Stored as a tiny weekly recurrence (weekday + start hour + length);
 * whether stillness holds right now is computed, never scheduled — nothing
 * to notify, nothing to miss. While it holds, the app is dark except one
 * line, and the monthly ask is suppressed (wired when OPEN lands, M4).
 */
export interface StillnessConfig {
  /** 0 = Sunday … 6 = Saturday (JS Date.getDay()). */
  weekday: number;
  /** Local start hour, 0–23. */
  startHour: number;
  /** Window length in whole hours; same-day windows only. */
  hours: number;
}

export async function setStillness(db: SqlDatabase, config: StillnessConfig): Promise<void> {
  if (
    !Number.isInteger(config.weekday) || config.weekday < 0 || config.weekday > 6 ||
    !Number.isInteger(config.startHour) || config.startHour < 0 || config.startHour > 23 ||
    !Number.isInteger(config.hours) || config.hours < 1 || config.startHour + config.hours > 24
  ) {
    throw new Error('Stillness window must fit within one day.');
  }
  await db.execute('UPDATE quiet_state SET stillness = ? WHERE id = 1', [
    JSON.stringify(config),
  ]);
}

export async function getStillness(db: SqlDatabase): Promise<StillnessConfig | null> {
  const result = await db.execute('SELECT stillness FROM quiet_state WHERE id = 1');
  const raw = result.rows[0]?.stillness;
  return raw ? (JSON.parse(String(raw)) as StillnessConfig) : null;
}

export async function clearStillness(db: SqlDatabase): Promise<void> {
  await db.execute('UPDATE quiet_state SET stillness = NULL WHERE id = 1');
}

/** Does the designed window hold right now? Pure recurrence math. */
export function stillnessHolds(config: StillnessConfig | null, now: Date): boolean {
  if (!config) return false;
  if (now.getDay() !== config.weekday) return false;
  const hour = now.getHours() + now.getMinutes() / 60;
  return hour >= config.startHour && hour < config.startHour + config.hours;
}

export async function isStillnessNow(db: SqlDatabase, now: Date): Promise<boolean> {
  return stillnessHolds(await getStillness(db), now);
}

/**
 * The closing question — "how does this feel compared to before?" — ends the
 * program; the answer is kept as an unscored-leaning reflection (04 §2.1).
 */
export async function completeDetox(db: SqlDatabase, answer: string, now: Date): Promise<void> {
  const detox = await activeDetox(db, now);
  if (!detox) throw new Error('No detox is running.');
  if (answer.trim().length > 0) {
    await addEntry(
      db,
      { type: 'path_reflection', text: answer, channelKeys: detox.state.redList, origin: 'auto' },
      now,
    );
  }
  await db.execute("UPDATE quiet_state SET mode = 'none', detox = NULL WHERE id = 1");
}
