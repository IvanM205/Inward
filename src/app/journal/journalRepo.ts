/**
 * Living Journal repository (JRN-01..05, 03 §JournalEntry).
 *
 * Saving is unconditional — the journal is written for the soul. Counting
 * toward the evidence offset (04 §2.2) is decided here at save time:
 * specificity, the daily cap (max 3 counted/day, max 1 per manual type), and
 * diminishing returns for near-duplicates. The stored weight is
 * base × 0.5^repeat_index; per-channel factors stay in core/scoring.
 */
import {
  ChannelKey,
  DAILY_COUNTED_CAP,
  ENTRY_WEIGHTS,
  EntryType,
  REPEAT_DECAY,
  SIMILARITY_WINDOW_DAYS,
} from '../../core/scoring/config';
import { CountedEntry } from '../../core/scoring/engine';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { dateKeyDaysAgo, localDateKey, toLocalIso } from '../../core/storage/time';
import { isSpecific, repeatIndex } from './counting';

export type EntryOrigin = 'evening' | 'widget' | 'auto' | 'companion';

/** Hand-written types capped at one counted entry per day each (04 §2.2). */
export const MANUAL_TYPES: EntryType[] = ['kindness', 'care', 'aliveness'];

export interface JournalEntry {
  id: string;
  createdAt: string;
  type: EntryType;
  text: string;
  channelKeys: ChannelKey[];
  counted: boolean;
  weight: number;
  repeatIndex: number;
  origin: EntryOrigin;
}

export interface NewJournalEntry {
  type: EntryType;
  text: string;
  /** Channels this entry weighs against (auto-suggested, editable — 03). */
  channelKeys: ChannelKey[];
  origin: EntryOrigin;
}

function rowToEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    type: String(row.type) as EntryType,
    text: String(row.text),
    channelKeys: JSON.parse(String(row.channel_keys)) as ChannelKey[],
    counted: Number(row.counted) === 1,
    weight: Number(row.weight),
    repeatIndex: Number(row.repeat_index),
    origin: String(row.origin) as EntryOrigin,
  };
}

async function countedToday(db: SqlDatabase, now: Date): Promise<JournalEntry[]> {
  const result = await db.execute(
    'SELECT * FROM journal_entry WHERE counted = 1 AND created_at LIKE ?',
    [`${localDateKey(now)}%`],
  );
  return result.rows.map(rowToEntry);
}

async function recentTexts(db: SqlDatabase, now: Date): Promise<string[]> {
  const cutoff = dateKeyDaysAgo(now, SIMILARITY_WINDOW_DAYS);
  const result = await db.execute(
    'SELECT text FROM journal_entry WHERE created_at >= ?',
    [cutoff],
  );
  return result.rows.map((r) => String(r.text));
}

/**
 * Saves an entry, applying the counting rules (04 §2.2). The returned entry's
 * `counted` drives the gentle UX marking (JRN-04) — never an error.
 */
export async function addEntry(
  db: SqlDatabase,
  entry: NewJournalEntry,
  now: Date,
): Promise<JournalEntry> {
  if (!(entry.type in ENTRY_WEIGHTS)) {
    throw new Error(`Unknown journal entry type "${entry.type}".`);
  }

  const todays = await countedToday(db, now);
  const underDailyCap = todays.length < DAILY_COUNTED_CAP;
  const underTypeCap =
    !MANUAL_TYPES.includes(entry.type) || !todays.some((e) => e.type === entry.type);
  const repeats = repeatIndex(entry.text, await recentTexts(db, now));
  const counted = isSpecific(entry.text) && underDailyCap && underTypeCap;
  const weight = counted ? ENTRY_WEIGHTS[entry.type] * REPEAT_DECAY ** repeats : 0;

  const saved: JournalEntry = {
    id: newId(),
    createdAt: toLocalIso(now),
    type: entry.type,
    text: entry.text,
    channelKeys: entry.channelKeys,
    counted,
    weight,
    repeatIndex: repeats,
    origin: entry.origin,
  };
  await db.execute(
    `INSERT INTO journal_entry
       (id, created_at, type, text, channel_keys, counted, weight, repeat_index, origin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      saved.id,
      saved.createdAt,
      saved.type,
      saved.text,
      JSON.stringify(saved.channelKeys),
      counted ? 1 : 0,
      saved.weight,
      saved.repeatIndex,
      saved.origin,
    ],
  );
  return saved;
}

/**
 * Counted entries in the trailing evidence window, shaped for
 * core/scoring.evidenceOffset (the weekly recalc, 04 §4 — lands fully in M2).
 */
export async function countedEntriesSince(db: SqlDatabase, now: Date, days: number): Promise<CountedEntry[]> {
  const cutoff = dateKeyDaysAgo(now, days);
  const result = await db.execute(
    'SELECT * FROM journal_entry WHERE counted = 1 AND created_at >= ?',
    [cutoff],
  );
  return result.rows.map(rowToEntry).map((e) => ({
    type: e.type,
    channelKeys: e.channelKeys,
    repeatIndex: e.repeatIndex,
  }));
}

/** Search the user's own finite journal (JRN-05); newest first, has an end. */
export async function searchEntries(db: SqlDatabase, query: string): Promise<JournalEntry[]> {
  const result = await db.execute(
    'SELECT * FROM journal_entry WHERE text LIKE ? ORDER BY created_at DESC',
    [`%${query}%`],
  );
  return result.rows.map(rowToEntry);
}

/** All entries written on one local date (evening fold review, export). */
export async function entriesOn(db: SqlDatabase, date: string): Promise<JournalEntry[]> {
  const result = await db.execute(
    'SELECT * FROM journal_entry WHERE created_at LIKE ? ORDER BY created_at',
    [`${date}%`],
  );
  return result.rows.map(rowToEntry);
}
