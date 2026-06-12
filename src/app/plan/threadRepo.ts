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

export interface Thread {
  id: string;
  channelKey: ChannelKey;
  startedAt: string;
  status: ThreadStatus;
  weeksHeld: number;
}

function rowToThread(row: Record<string, unknown>): Thread {
  return {
    id: String(row.id),
    channelKey: String(row.channel_key) as ChannelKey,
    startedAt: String(row.started_at),
    status: String(row.status) as ThreadStatus,
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
