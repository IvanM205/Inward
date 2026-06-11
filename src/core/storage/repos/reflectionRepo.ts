/**
 * Reflection repository — the evening Compass record (03 §Reflection):
 * one row per local date, a direction on the spirit↔matter spectrum
 * (−1.0 matter … +1.0 spirit), an optional line, 0–3 gratitudes.
 * Feeds the Needle: the ONLY data visualization in the app, the drift of the
 * 90-day mean (04 §5).
 */
import { newId } from '../ids';
import { SqlDatabase } from '../ports';
import { dateKeyDaysAgo, localDateKey } from '../time';

export const NEEDLE_WINDOW_DAYS = 90;
export const MAX_GRATITUDES = 3;

export interface Reflection {
  id: string;
  /** Local date key "YYYY-MM-DD". */
  date: string;
  /** −1.0 matter … +1.0 spirit. */
  direction: number;
  line: string | null;
  gratitudes: string[];
}

export interface ReflectionInput {
  date: string;
  direction: number;
  line?: string;
  gratitudes?: string[];
}

function rowToReflection(row: Record<string, unknown>): Reflection {
  return {
    id: String(row.id),
    date: String(row.date),
    direction: Number(row.direction),
    line: row.line === null ? null : String(row.line),
    gratitudes: JSON.parse(String(row.gratitudes)) as string[],
  };
}

/**
 * Saves the evening reflection. Re-running the evening flow on the same date
 * replaces that date's reflection — one direction per day, no accumulation.
 */
export async function saveReflection(db: SqlDatabase, input: ReflectionInput): Promise<Reflection> {
  if (!Number.isFinite(input.direction) || input.direction < -1 || input.direction > 1) {
    throw new Error(`direction out of range −1.0…+1.0: ${input.direction}`);
  }
  const gratitudes = input.gratitudes ?? [];
  if (gratitudes.length > MAX_GRATITUDES) {
    throw new Error(`At most ${MAX_GRATITUDES} gratitudes (THR-03), got ${gratitudes.length}.`);
  }
  await db.execute('DELETE FROM reflection WHERE date = ?', [input.date]);
  const id = newId();
  await db.execute(
    'INSERT INTO reflection (id, date, direction, line, gratitudes) VALUES (?, ?, ?, ?, ?)',
    [id, input.date, input.direction, input.line ?? null, JSON.stringify(gratitudes)],
  );
  return { id, date: input.date, direction: input.direction, line: input.line ?? null, gratitudes };
}

export async function reflectionForDate(db: SqlDatabase, date: string): Promise<Reflection | null> {
  const result = await db.execute('SELECT * FROM reflection WHERE date = ?', [date]);
  const row = result.rows[0];
  return row ? rowToReflection(row) : null;
}

/**
 * The Needle's heading: mean direction over the trailing 90 days, or null when
 * no reflection exists yet (the needle rests; nothing is invented).
 */
export async function needleDirection(db: SqlDatabase, today: Date): Promise<number | null> {
  const cutoff = dateKeyDaysAgo(today, NEEDLE_WINDOW_DAYS - 1);
  const result = await db.execute(
    'SELECT AVG(direction) AS mean FROM reflection WHERE date >= ? AND date <= ?',
    [cutoff, localDateKey(today)],
  );
  const mean = result.rows[0]?.mean;
  return mean === null || mean === undefined ? null : Number(mean);
}
