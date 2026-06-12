/**
 * PLAN-05 — Build One Thing: one named skill per season, one weekly question
 * ("did your hands learn something this week?"), one Evidence entry when the
 * answer is yes. No minutes, no levels, no progress bars — deliberately
 * nothing here that could be charted.
 */
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { localDateKey } from '../../core/storage/time';
import { addEntry } from '../journal/journalRepo';
import { weekIndexOf } from '../mirror/recalc';

export interface BuildThing {
  id: string;
  name: string;
  startedOn: string;
  lastCheckinWeek: number | null;
}

export async function buildThing(db: SqlDatabase): Promise<BuildThing | null> {
  const result = await db.execute('SELECT * FROM build_thing ORDER BY started_on DESC LIMIT 1');
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    startedOn: String(row.started_on),
    lastCheckinWeek: row.last_checkin_week === null ? null : Number(row.last_checkin_week),
  };
}

/** Names the season's one thing; naming again replaces it (a new season). */
export async function nameBuildThing(db: SqlDatabase, name: string, now: Date): Promise<void> {
  await db.execute('DELETE FROM build_thing');
  await db.execute(
    'INSERT INTO build_thing (id, name, started_on) VALUES (?, ?, ?)',
    [newId(), name.trim(), localDateKey(now)],
  );
}

/** The weekly question is due when this week has not asked it yet. */
export async function buildCheckinDue(db: SqlDatabase, now: Date): Promise<boolean> {
  const thing = await buildThing(db);
  if (!thing) return false;
  return thing.lastCheckinWeek === null || thing.lastCheckinWeek < weekIndexOf(now);
}

/**
 * The weekly check-in. A line about what the hands learned becomes an
 * aliveness Evidence entry on abandoned_skills; an empty answer just settles
 * the week — no entry, no comment, no count of misses.
 */
export async function buildCheckin(db: SqlDatabase, line: string, now: Date): Promise<void> {
  const thing = await buildThing(db);
  if (!thing) throw new Error('No thing is being built this season (PLAN-05).');
  if (line.trim().length > 0) {
    await addEntry(
      db,
      {
        type: 'aliveness',
        text: line.trim(),
        channelKeys: ['abandoned_skills'],
        origin: 'auto',
      },
      now,
    );
  }
  await db.execute('UPDATE build_thing SET last_checkin_week = ? WHERE id = ?', [
    weekIndexOf(now),
    thing.id,
  ]);
}
