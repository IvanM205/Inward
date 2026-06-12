/**
 * Weekly Realignment storage (RLG-01, 03 §RealignmentWeek). One review per
 * week; the week is keyed by its Monday so "due" is a calendar fact.
 */
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { localDateKey } from '../../core/storage/time';

/** Hand-tagged hours/money — the person's own accounting (no harvesting). */
export interface Ledger {
  screenHours: number;
  spentOnWanting: number;
}

export interface ValueHours {
  hoursToWhatYouLove: number;
}

export interface RealignmentWeek {
  id: string;
  weekStart: string;
  ledger: Ledger;
  valueHours: ValueHours;
  commitment: string;
}

/** Monday of the week containing `now`, as a local date key. */
export function weekStartOf(now: Date): string {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = (monday.getDay() + 6) % 7; // Mon=0 … Sun=6
  monday.setDate(monday.getDate() - offset);
  return localDateKey(monday);
}

export async function realignmentForWeek(
  db: SqlDatabase,
  now: Date,
): Promise<RealignmentWeek | null> {
  const result = await db.execute('SELECT * FROM realignment_week WHERE week_start = ?', [
    weekStartOf(now),
  ]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    weekStart: String(row.week_start),
    ledger: JSON.parse(String(row.ledger)) as Ledger,
    valueHours: JSON.parse(String(row.value_hours)) as ValueHours,
    commitment: String(row.commitment),
  };
}

/** The realignment is due when this week has none yet (RLG-01). */
export async function realignmentDue(db: SqlDatabase, now: Date): Promise<boolean> {
  return (await realignmentForWeek(db, now)) === null;
}

export async function saveRealignment(
  db: SqlDatabase,
  now: Date,
  ledger: Ledger,
  valueHours: ValueHours,
  commitment: string,
): Promise<RealignmentWeek> {
  const week: RealignmentWeek = {
    id: newId(),
    weekStart: weekStartOf(now),
    ledger,
    valueHours,
    commitment: commitment.trim(),
  };
  await db.execute('DELETE FROM realignment_week WHERE week_start = ?', [week.weekStart]);
  await db.execute(
    `INSERT INTO realignment_week (id, week_start, ledger, value_hours, commitment)
     VALUES (?, ?, ?, ?, ?)`,
    [week.id, week.weekStart, JSON.stringify(ledger), JSON.stringify(valueHours), week.commitment],
  );
  return week;
}
