import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { startThread } from '../../plan/threadRepo';
import { suggestedChannels } from '../channelSuggestion';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const NOW = new Date(2026, 5, 12, 10, 0);

describe('suggestedChannels (03 §JournalEntry, 04 §2.1)', () => {
  it('routes aliveness, care, and gratitude to the active thread', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    expect(await suggestedChannels(db, 'aliveness')).toEqual(['feeds']);
    expect(await suggestedChannels(db, 'care')).toEqual(['feeds']);
    expect(await suggestedChannels(db, 'gratitude')).toEqual(['feeds']);
  });

  it('kindness always carries relationships, plus the thread', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    expect(await suggestedChannels(db, 'kindness')).toEqual(['relationships', 'feeds']);
  });

  it('kindness on a relationships thread does not duplicate the tag', async () => {
    const db = await openDb();
    await startThread(db, 'relationships', NOW);
    expect(await suggestedChannels(db, 'kindness')).toEqual(['relationships']);
  });

  it('without a thread, kindness still reaches relationships; the rest wait', async () => {
    const db = await openDb();
    expect(await suggestedChannels(db, 'kindness')).toEqual(['relationships']);
    expect(await suggestedChannels(db, 'aliveness')).toEqual([]);
    expect(await suggestedChannels(db, 'gratitude')).toEqual([]);
  });
});
