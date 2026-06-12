import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { activeThread, pauseThread, startThread } from '../threadRepo';

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

describe('threadRepo (PLAN-01)', () => {
  it('starts a season on one channel', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    const thread = await activeThread(db);
    expect(thread!.channelKey).toBe('feeds');
    expect(thread!.status).toBe('active');
    expect(thread!.weeksHeld).toBe(0);
  });

  it('refuses a second active thread — one channel per season', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    await expect(startThread(db, 'series', NOW)).rejects.toThrow(/One thread at a time/);
  });

  it('the single-active rule holds at the database itself', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    // Bypass the repo guard: the partial unique index still refuses.
    await expect(
      db.execute(
        "INSERT INTO thread (id, channel_key, started_at, status) VALUES ('t2', 'series', 'now', 'active')",
      ),
    ).rejects.toThrow(/UNIQUE|constraint/i);
  });

  it('pausing frees the season for a new thread; nothing is lost', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    await pauseThread(db);
    expect(await activeThread(db)).toBeNull();
    await startThread(db, 'series', NOW); // now allowed
    const rows = await db.execute('SELECT COUNT(*) AS n FROM thread');
    expect(rows.rows[0].n).toBe(2); // the paused thread waits where it was left
  });
});
