/**
 * The Library's daily logic (LIB-01): exactly one reading per day, chosen by
 * a deterministic rotation — no recommendation, no novelty engine, the same
 * piece for everyone on the same day of the cycle. The archive allows one
 * revisit per day, total: yesterday's depth is not today's binge (INV-1).
 */
import { Reading, READINGS, readingById } from '../../core/content/readings';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { localDateKey } from '../../core/storage/time';

const DAY_MS = 24 * 3600 * 1000;

/** Today's one reading — rotation by local day, stable all day long. */
export function todaysReading(now: Date): Reading {
  const localDays = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / DAY_MS,
  );
  return READINGS[localDays % READINGS.length];
}

/** Records that today's reading was read (idempotent per day). */
export async function logReadingRead(db: SqlDatabase, reading: Reading, now: Date): Promise<void> {
  await db.execute(
    'INSERT OR IGNORE INTO reading_log (id, reading_id, read_on) VALUES (?, ?, ?)',
    [newId(), reading.id, localDateKey(now)],
  );
}

/** Past readings, newest first — finite, already-lived, with a visible end. */
export async function archive(db: SqlDatabase, now: Date): Promise<Reading[]> {
  const result = await db.execute(
    'SELECT DISTINCT reading_id FROM reading_log WHERE read_on < ? ORDER BY read_on DESC',
    [localDateKey(now)],
  );
  return result.rows
    .map((r) => readingById(String(r.reading_id)))
    .filter((r): r is Reading => r !== undefined);
}

/**
 * One revisit per day across the whole archive (LIB-01). Returns the reading
 * when the day still has its revisit; null means: tomorrow, gladly.
 */
export async function revisit(
  db: SqlDatabase,
  readingId: string,
  now: Date,
): Promise<Reading | null> {
  const today = localDateKey(now);
  const used = await db.execute(
    'SELECT COUNT(*) AS n FROM reading_log WHERE read_on = ? AND revisits > 0',
    [today],
  );
  if (Number(used.rows[0].n) > 0) return null;
  const reading = readingById(readingId);
  if (!reading) return null;
  await db.execute(
    'INSERT OR IGNORE INTO reading_log (id, reading_id, read_on) VALUES (?, ?, ?)',
    [newId(), readingId, today],
  );
  await db.execute('UPDATE reading_log SET revisits = 1 WHERE reading_id = ? AND read_on = ?', [
    readingId,
    today,
  ]);
  return reading;
}
