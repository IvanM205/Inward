/**
 * Path progress (LIB-02, 03 §PathProgress). One active Path at most; one day
 * per calendar day — depth has a pace, and the pace is the point (INV-1).
 * Finishing the last day writes a path_reflection Evidence entry and clears
 * the way for another Path, later, if wanted.
 */
import { Path, pathById } from '../../core/content/paths';
import { SqlDatabase } from '../../core/storage/ports';
import { localDateKey } from '../../core/storage/time';
import { suggestedChannels } from '../journal/channelSuggestion';
import { addEntry } from '../journal/journalRepo';

export interface PathState {
  path: Path;
  /** 1-based day of the path. */
  dayIndex: number;
  /** Today's day was already walked; the next opens tomorrow. */
  doneToday: boolean;
  actsDone: boolean[];
}

export async function activePath(db: SqlDatabase, now: Date): Promise<PathState | null> {
  const result = await db.execute('SELECT * FROM path_progress WHERE id = 1');
  const row = result.rows[0];
  if (!row) return null;
  const path = pathById(String(row.path_id));
  if (!path) return null;
  return {
    path,
    dayIndex: Number(row.day_index),
    doneToday: row.last_day_done_on === localDateKey(now),
    actsDone: JSON.parse(String(row.acts_done)) as boolean[],
  };
}

export async function startPath(db: SqlDatabase, pathId: string, now: Date): Promise<void> {
  const existing = await db.execute('SELECT id FROM path_progress WHERE id = 1');
  if (existing.rows.length > 0) {
    throw new Error('One Path at a time (LIB-02) — finish or let go of the current one.');
  }
  if (!pathById(pathId)) throw new Error(`Unknown path "${pathId}".`);
  await db.execute(
    'INSERT INTO path_progress (id, path_id, started_on) VALUES (1, ?, ?)',
    [pathId, localDateKey(now)],
  );
}

/**
 * Completes the current day. On the final day the closing line becomes a
 * path_reflection Evidence entry (04 §2.1) and the Path ends; otherwise the
 * next day opens tomorrow. Returns whether the whole Path is now walked.
 */
export async function completePathDay(
  db: SqlDatabase,
  actDone: boolean,
  closingLine: string,
  now: Date,
): Promise<boolean> {
  const state = await activePath(db, now);
  if (!state) throw new Error('No Path is being walked.');
  if (state.doneToday) throw new Error('Today is already walked — the next day opens tomorrow.');

  const actsDone = [...state.actsDone, actDone];
  const finished = state.dayIndex >= state.path.days.length;
  if (finished) {
    if (closingLine.trim().length > 0) {
      await addEntry(
        db,
        {
          type: 'path_reflection',
          text: closingLine.trim(),
          channelKeys: await suggestedChannels(db, 'path_reflection'),
          origin: 'auto',
        },
        now,
      );
    }
    await db.execute('DELETE FROM path_progress WHERE id = 1');
    return true;
  }
  await db.execute(
    'UPDATE path_progress SET day_index = ?, last_day_done_on = ?, acts_done = ? WHERE id = 1',
    [state.dayIndex + 1, localDateKey(now), JSON.stringify(actsDone)],
  );
  return false;
}
