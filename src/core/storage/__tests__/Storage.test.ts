import { Storage } from '../Storage';
import { CHANNELS, MIGRATIONS } from '../migrations';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../testing/fakes';

function makeStorage() {
  const deps = {
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  };
  return { storage: new Storage(deps), deps };
}

describe('Storage open & migrations', () => {
  it('creates the schema and seeds the twelve channels in canonical order', async () => {
    const { storage } = makeStorage();
    const db = await storage.open();
    const channels = await db.execute('SELECT key, "order" FROM channel ORDER BY "order"');
    expect(channels.rows.map((r) => r.key)).toEqual(CHANNELS.map((c) => c.key));
    expect(channels.rows).toHaveLength(12);
  });

  it('is idempotent across reopen — migrations do not reapply', async () => {
    const { storage, deps } = makeStorage();
    await storage.open();
    await storage.database.execute(
      "INSERT INTO profile (id, created_at) VALUES ('p1', '2026-06-10T12:00:00+02:00')",
    );
    // Simulate app relaunch: same provider (file survives), new Storage.
    const relaunched = new Storage(deps);
    const db = await relaunched.open();
    const profiles = await db.execute('SELECT id FROM profile');
    expect(profiles.rows).toHaveLength(1);
    const versions = await db.execute('SELECT COUNT(*) AS n FROM schema_version');
    expect(versions.rows[0].n).toBe(MIGRATIONS.length); // one row per migration, applied once
  });

  it('enforces the onboarding_state enum from 03-data-model', async () => {
    const { storage } = makeStorage();
    const db = await storage.open();
    await expect(
      db.execute(
        "INSERT INTO profile (id, created_at, onboarding_state) VALUES ('p1', 'now', 'doom_scrolling')",
      ),
    ).rejects.toThrow(/CHECK/);
  });
});

describe('eraseAll — one-tap total erasure (INV-6, NFR-P4)', () => {
  it('wipes data, deletes the key, clears widgets, cancels notifications', async () => {
    const { storage, deps } = makeStorage();
    await storage.open();
    await storage.database.execute(
      "INSERT INTO profile (id, created_at, display_name) VALUES ('p1', 'now', 'Ivan')",
    );

    await storage.eraseAll();

    expect(deps.databaseProvider.fileExists).toBe(false);
    expect(deps.keyStore.hasKey).toBe(false);
    expect(deps.widgets.cleared).toBe(1);
    expect(deps.notifications.cancelled).toBe(1);
    expect(() => storage.database).toThrow(/not open/);
  });

  it('re-launch after erasure equals true first run (NFR-P4)', async () => {
    const { storage, deps } = makeStorage();
    await storage.open();
    await storage.database.execute(
      "INSERT INTO profile (id, created_at) VALUES ('p1', 'now')",
    );
    await storage.eraseAll();

    // Relaunch: a brand-new key is generated, schema is rebuilt, no personal data.
    const relaunched = new Storage(deps);
    const db = await relaunched.open();
    expect(deps.keyStore.generated).toBe(2);
    const profiles = await db.execute('SELECT * FROM profile');
    expect(profiles.rows).toHaveLength(0);
    const channels = await db.execute('SELECT COUNT(*) AS n FROM channel');
    expect(channels.rows[0].n).toBe(12); // static seed content is back, like first run
  });

  it('a surviving database copy is unreadable once the key is gone', async () => {
    const { storage, deps } = makeStorage();
    await storage.open();
    await storage.eraseAll();
    // Even if an attacker kept a copy keyed to key-1, relaunch uses key-2.
    await new Storage(deps).open();
    await expect(deps.databaseProvider.open('key-1')).rejects.toThrow(/not a database/);
  });
});
