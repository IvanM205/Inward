/**
 * The dare ladder (PLAN-02, 03 §Dare): seven escalating real-world
 * challenges per thread, offered one at a time, roughly weekly. Completing
 * one auto-creates a dare_done Evidence entry (weight 1.0 toward the
 * thread's channel, 04 §2.1). Skipping leaves the ladder exactly where it
 * was — nothing resets, ever (PLAN-04, INV-7).
 */
import { dareLadderFor } from '../../core/content/dareTemplates';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { dateKeyDaysAgo, localDateKey } from '../../core/storage/time';
import { addEntry } from '../journal/journalRepo';
import { Thread } from './threadRepo';

/** A new dare is due when none was touched in the trailing week. */
export const DARE_REST_DAYS = 6;

export interface Dare {
  id: string;
  threadId: string;
  rung: number;
  text: string;
  source: 'template' | 'custom' | 'circle';
  status: 'waiting' | 'offered' | 'done' | 'skipped';
  offeredOn: string | null;
  doneOn: string | null;
  feelingAnswer: string | null;
}

function rowToDare(row: Record<string, unknown>): Dare {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    rung: Number(row.rung),
    text: String(row.text),
    source: String(row.source) as Dare['source'],
    status: String(row.status) as Dare['status'],
    offeredOn: row.offered_on ? String(row.offered_on) : null,
    doneOn: row.done_on ? String(row.done_on) : null,
    feelingAnswer: row.feeling_answer ? String(row.feeling_answer) : null,
  };
}

/** Seeds the 7 template rungs for a fresh thread (idempotent per thread). */
export async function seedLadder(db: SqlDatabase, thread: Thread): Promise<void> {
  const existing = await db.execute('SELECT COUNT(*) AS n FROM dare WHERE thread_id = ?', [
    thread.id,
  ]);
  if (Number(existing.rows[0].n) > 0) return;
  const texts = dareLadderFor(thread.channelKey);
  for (let i = 0; i < texts.length; i++) {
    await db.execute(
      'INSERT INTO dare (id, thread_id, rung, text) VALUES (?, ?, ?, ?)',
      [newId(), thread.id, i + 1, texts[i]],
    );
  }
}

export async function ladder(db: SqlDatabase, threadId: string): Promise<Dare[]> {
  const result = await db.execute('SELECT * FROM dare WHERE thread_id = ? ORDER BY rung', [
    threadId,
  ]);
  return result.rows.map(rowToDare);
}

/**
 * The dare due today, if any: an already-offered one stays offered until
 * answered; otherwise the lowest waiting rung — but only after a week of
 * rest since the ladder was last touched. Null means today belongs to the
 * micro-act.
 */
export async function dueDare(db: SqlDatabase, threadId: string, now: Date): Promise<Dare | null> {
  const rungs = await ladder(db, threadId);
  const offered = rungs.find((d) => d.status === 'offered');
  if (offered) return offered;

  const cutoff = dateKeyDaysAgo(now, DARE_REST_DAYS);
  const touchedRecently = rungs.some((d) => {
    const last = d.doneOn ?? d.offeredOn;
    return last !== null && last > cutoff;
  });
  if (touchedRecently) return null;

  const next = rungs.find((d) => d.status === 'waiting');
  if (!next) return null;
  await db.execute("UPDATE dare SET status = 'offered', offered_on = ? WHERE id = ?", [
    localDateKey(now),
    next.id,
  ]);
  return { ...next, status: 'offered', offeredOn: localDateKey(now) };
}

/** Done — with the one question: how did it feel? (06 §DareCard). */
export async function completeDare(
  db: SqlDatabase,
  dare: Dare,
  thread: Thread,
  feeling: string,
  now: Date,
): Promise<void> {
  await db.execute(
    "UPDATE dare SET status = 'done', done_on = ?, feeling_answer = ? WHERE id = ?",
    [localDateKey(now), feeling.trim() || null, dare.id],
  );
  await addEntry(
    db,
    {
      type: 'dare_done',
      text: feeling.trim() || dare.text,
      channelKeys: [thread.channelKey],
      origin: 'auto',
    },
    now,
  );
}

/** Skipped, kindly: the rung stays on the ladder, unjudged (INV-7). */
export async function skipDare(db: SqlDatabase, dare: Dare, now: Date): Promise<void> {
  await db.execute("UPDATE dare SET status = 'skipped', done_on = ? WHERE id = ?", [
    localDateKey(now),
    dare.id,
  ]);
}
