/**
 * Threads — the Liberation Plan (PLAN-01, 03 §Thread). Exactly one channel is
 * under loosening per season; starting another requires graduating or pausing
 * the current one first. The vow wizard, micro-act, and dare ladder fill the
 * thread in M3 — this repo establishes the spine.
 */
import { ChannelKey } from '../../core/scoring/config';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { toLocalIso } from '../../core/storage/time';

export type ThreadStatus = 'active' | 'paused' | 'graduated' | 'abandoned';

/** The habit loop in the person's own words (PLAN-02, 03 §Thread). */
export interface ReplacementHabit {
  cue: string;
  routine: string;
  reward: string;
  vowText: string;
}

export interface Thread {
  id: string;
  channelKey: ChannelKey;
  startedAt: string;
  status: ThreadStatus;
  replacementHabit: ReplacementHabit | null;
  microAct: string | null;
  /** Local date Today's Opening was last completed (THR-04 due state). */
  openingDoneOn: string | null;
  weeksHeld: number;
}

function rowToThread(row: Record<string, unknown>): Thread {
  return {
    id: String(row.id),
    channelKey: String(row.channel_key) as ChannelKey,
    startedAt: String(row.started_at),
    status: String(row.status) as ThreadStatus,
    replacementHabit: row.replacement_habit
      ? (JSON.parse(String(row.replacement_habit)) as ReplacementHabit)
      : null,
    microAct: row.micro_act ? String(row.micro_act) : null,
    openingDoneOn: row.opening_done_on ? String(row.opening_done_on) : null,
    weeksHeld: Number(row.weeks_held),
  };
}

export async function activeThread(db: SqlDatabase): Promise<Thread | null> {
  const result = await db.execute("SELECT * FROM thread WHERE status = 'active'");
  const row = result.rows[0];
  return row ? rowToThread(row) : null;
}

/**
 * Begins a season on one channel. Throws if a thread is already active —
 * selecting a new one requires graduating or pausing the current (PLAN-01).
 */
export async function startThread(
  db: SqlDatabase,
  channel: ChannelKey,
  now: Date,
): Promise<Thread> {
  const current = await activeThread(db);
  if (current) {
    throw new Error(
      `One thread at a time (PLAN-01): "${current.channelKey}" is active — graduate or pause it first.`,
    );
  }
  const thread: Thread = {
    id: newId(),
    channelKey: channel,
    startedAt: toLocalIso(now),
    status: 'active',
    replacementHabit: null,
    microAct: null,
    openingDoneOn: null,
    weeksHeld: 0,
  };
  await db.execute(
    'INSERT INTO thread (id, channel_key, started_at, status) VALUES (?, ?, ?, ?)',
    [thread.id, thread.channelKey, thread.startedAt, thread.status],
  );
  return thread;
}

/** Pausing keeps everything; the ladder waits where it was left (INV-7). */
export async function pauseThread(db: SqlDatabase): Promise<void> {
  await db.execute("UPDATE thread SET status = 'paused' WHERE status = 'active'");
}

async function requireActive(db: SqlDatabase): Promise<Thread> {
  const thread = await activeThread(db);
  if (!thread) throw new Error('No active thread — start a season first (PLAN-01).');
  return thread;
}

/** Stores the mapped loop and the when–then vow, in the person's words (PLAN-02). */
export async function setReplacementHabit(
  db: SqlDatabase,
  habit: ReplacementHabit,
): Promise<void> {
  const thread = await requireActive(db);
  await db.execute('UPDATE thread SET replacement_habit = ? WHERE id = ?', [
    JSON.stringify(habit),
    thread.id,
  ]);
}

/** The daily micro-act — under five minutes, doable on the worst day (PLAN-02). */
export async function setMicroAct(db: SqlDatabase, microAct: string): Promise<void> {
  const thread = await requireActive(db);
  await db.execute('UPDATE thread SET micro_act = ? WHERE id = ?', [microAct, thread.id]);
}

/** Marks Today's Opening complete for a local date (THR-04). */
export async function markOpeningDone(db: SqlDatabase, date: string): Promise<void> {
  const thread = await requireActive(db);
  await db.execute('UPDATE thread SET opening_done_on = ? WHERE id = ?', [date, thread.id]);
}

/** Graduation at this many held weeks (PLAN-04). */
export const GRADUATION_WEEKS = 4;

/**
 * Season accounting (PLAN-04), called by the weekly recalc: a held week
 * (lived evidence on the thread's channel) advances weeks_held; a week
 * without evidence advances NOTHING — relapse resets nothing, the count
 * simply waits (INV-7). Idempotent per week_index. At four held weeks the
 * thread graduates, celebrated once by a terminal sentence.
 */
export async function advanceSeasonWeek(
  db: SqlDatabase,
  weekIndex: number,
  held: boolean,
): Promise<void> {
  const thread = await activeThread(db);
  if (!thread) return;
  const row = await db.execute('SELECT last_week_advanced FROM thread WHERE id = ?', [thread.id]);
  const last = row.rows[0]?.last_week_advanced;
  if (last !== null && last !== undefined && Number(last) >= weekIndex) return; // this week is settled
  if (!held) {
    await db.execute('UPDATE thread SET last_week_advanced = ? WHERE id = ?', [
      weekIndex,
      thread.id,
    ]);
    return;
  }
  const weeksHeld = thread.weeksHeld + 1;
  if (weeksHeld >= GRADUATION_WEEKS) {
    await db.execute(
      `UPDATE thread SET weeks_held = ?, last_week_advanced = ?, status = 'graduated',
        celebrate_pending = 1 WHERE id = ?`,
      [weeksHeld, weekIndex, thread.id],
    );
    return;
  }
  await db.execute('UPDATE thread SET weeks_held = ?, last_week_advanced = ? WHERE id = ?', [
    weeksHeld,
    weekIndex,
    thread.id,
  ]);
}

/** The graduated thread awaiting its one quiet sentence, if any (PLAN-04). */
export async function pendingGraduation(db: SqlDatabase): Promise<Thread | null> {
  const result = await db.execute(
    "SELECT * FROM thread WHERE status = 'graduated' AND celebrate_pending = 1 LIMIT 1",
  );
  const row = result.rows[0];
  return row ? rowToThread(row) : null;
}

export async function markGraduationCelebrated(db: SqlDatabase, threadId: string): Promise<void> {
  await db.execute('UPDATE thread SET celebrate_pending = 0 WHERE id = ?', [threadId]);
}
