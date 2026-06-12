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

  it('the single-active rule is declared at the database itself', async () => {
    // Schema-level assertion (see Storage.test.ts on why not a violation
    // probe): the partial unique index is what makes PLAN-01 a database fact.
    const db = await openDb();
    const schema = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'thread_single_active'",
    );
    expect(String(schema.rows[0]?.sql)).toMatch(/UNIQUE INDEX .* WHERE status = 'active'/);
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
