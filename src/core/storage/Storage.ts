/**
 * core/storage — the encrypted on-device store and the one-tap total erasure.
 *
 * INV-5: all personal data on-device. INV-6 / NFR-P4: eraseAll() immediately
 * and irrecoverably deletes all personal data; a re-launch equals true first run.
 */
import { applyMigrations } from './migrations';
import {
  DatabaseProvider,
  KeyStore,
  NotificationCanceller,
  SqlDatabase,
  WidgetSurface,
} from './ports';

export interface StorageDeps {
  databaseProvider: DatabaseProvider;
  keyStore: KeyStore;
  widgets: WidgetSurface;
  notifications: NotificationCanceller;
}

export class Storage {
  private db: SqlDatabase | null = null;

  constructor(private readonly deps: StorageDeps) {}

  /** Opens (first run: creates + keys + migrates) the encrypted database. */
  async open(): Promise<SqlDatabase> {
    if (this.db) return this.db;
    const key = await this.deps.keyStore.getOrCreateKey();
    const db = await this.deps.databaseProvider.open(key);
    await applyMigrations(db);
    this.db = db;
    return db;
  }

  get database(): SqlDatabase {
    if (!this.db) throw new Error('Storage is not open.');
    return this.db;
  }

  /**
   * One-tap total erasure (INV-6, 03 §Erasure). Order matters:
   * widgets and notifications first (so no surface outlives the data), then
   * the database file, then the SQLCipher key — destroying the key makes any
   * surviving file copy permanently unreadable. The caller shows the
   * plain-words confirmation and resets navigation to first-run.
   */
  async eraseAll(): Promise<void> {
    await this.deps.widgets.clearAll();
    await this.deps.notifications.cancelAll();
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
    await this.deps.databaseProvider.deleteDatabase();
    await this.deps.keyStore.deleteKey();
  }
}
