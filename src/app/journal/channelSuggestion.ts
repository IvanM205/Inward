/**
 * Channel auto-suggestion for journal entries (03 §JournalEntry: channels are
 * "auto-suggested, editable"; 04 §2.1 mapping). Without tags an entry weighs
 * against nothing — this is where lived evidence connects to the score.
 *
 * The suggestion, per entry type:
 * - kindness   → relationships (its full-weight channel), plus the active
 *                thread — kindness done instead of the old habit counts there.
 * - care       → the active thread: care is the loosening itself.
 * - aliveness  → the active thread (04 §2.1: "auto-suggest active thread").
 * - gratitude / path_reflection → the active thread channel (04 §2.1).
 * Editable by the person; dare_done and craving_decoded carry their own
 * channel and never pass through here.
 */
import { ChannelKey, EntryType } from '../../core/scoring/config';
import { SqlDatabase } from '../../core/storage/ports';
import { activeThread } from '../plan/threadRepo';

export async function suggestedChannels(
  db: SqlDatabase,
  type: EntryType,
): Promise<ChannelKey[]> {
  const thread = await activeThread(db);
  const threadChannel = thread ? [thread.channelKey] : [];
  if (type === 'kindness') {
    return [...new Set<ChannelKey>(['relationships', ...threadChannel])];
  }
  return threadChannel;
}
