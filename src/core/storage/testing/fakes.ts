/**
 * Test fakes for the storage ports, backed by real SQLite (better-sqlite3,
 * dev-only) so migrations and erasure are exercised against genuine SQL.
 * The fake provider simulates SQLCipher keying: opening an existing database
 * with a different key fails, and deleting the key strands any copy.
 */
import Database from 'better-sqlite3';
import {
  DatabaseProvider,
  KeyStore,
  NotificationCanceller,
  SqlDatabase,
  SqlResult,
  WidgetSurface,
} from '../ports';

class FakeSqlDatabase implements SqlDatabase {
  constructor(private readonly db: Database.Database) {}

  async execute(sql: string, params: unknown[] = []): Promise<SqlResult> {
    const stmt = this.db.prepare(sql);
    if (stmt.reader) {
      return { rows: stmt.all(...params) as Record<string, unknown>[] };
    }
    stmt.run(...params);
    return { rows: [] };
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export class FakeDatabaseProvider implements DatabaseProvider {
  /** Simulates the encrypted file on disk: survives close, dies on delete. */
  private file: { db: Database.Database; key: string } | null = null;

  async open(encryptionKey: string): Promise<SqlDatabase> {
    if (this.file && this.file.key !== encryptionKey) {
      throw new Error('file is not a database'); // SQLCipher's wrong-key error
    }
    if (!this.file) {
      this.file = { db: new Database(':memory:'), key: encryptionKey };
    }
    return new FakeSqlDatabase(this.file.db);
  }

  async deleteDatabase(): Promise<void> {
    this.file?.db.close();
    this.file = null;
  }

  get fileExists(): boolean {
    return this.file !== null;
  }
}

export class FakeKeyStore implements KeyStore {
  private key: string | null = null;
  generated = 0;

  async getOrCreateKey(): Promise<string> {
    if (this.key === null) {
      this.generated += 1;
      this.key = `key-${this.generated}`;
    }
    return this.key;
  }

  async deleteKey(): Promise<void> {
    this.key = null;
  }

  get hasKey(): boolean {
    return this.key !== null;
  }
}

export class FakeWidgets implements WidgetSurface {
  cleared = 0;
  async clearAll(): Promise<void> {
    this.cleared += 1;
  }
}

export class FakeNotifications implements NotificationCanceller {
  cancelled = 0;
  async cancelAll(): Promise<void> {
    this.cancelled += 1;
  }
}
