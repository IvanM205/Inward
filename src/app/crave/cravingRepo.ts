/**
 * CravingEvent storage (CRAVE-03, 03 §CravingEvent). Every use writes a
 * craving_decoded Evidence entry; it weighs against the channel only when
 * the real-world action was taken (04 §2.1 "craving_decoded (action_taken)").
 */
import { ChannelKey } from '../../core/scoring/config';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { toLocalIso } from '../../core/storage/time';
import { addEntry } from '../journal/journalRepo';
import { Hunger } from './suggestions';

export interface CravingRecord {
  channelKey: ChannelKey | null;
  hunger: Hunger;
  actionSuggested: string;
  actionTaken: boolean;
  note: string | null;
}

export async function recordCraving(
  db: SqlDatabase,
  record: CravingRecord,
  now: Date,
): Promise<void> {
  await db.execute(
    `INSERT INTO craving_event
       (id, created_at, channel_key, hunger, action_suggested, action_taken, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      toLocalIso(now),
      record.channelKey,
      record.hunger,
      record.actionSuggested,
      record.actionTaken ? 1 : 0,
      record.note,
    ],
  );
  await addEntry(
    db,
    {
      type: 'craving_decoded',
      text: record.note?.trim()
        ? record.note.trim()
        : `decoded a craving — it was ${record.hunger}`,
      channelKeys: record.actionTaken && record.channelKey ? [record.channelKey] : [],
      origin: 'auto',
    },
    now,
  );
}
