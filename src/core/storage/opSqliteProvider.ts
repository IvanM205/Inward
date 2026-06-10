/**
 * Production DatabaseProvider over op-sqlite compiled with SQLCipher
 * (package.json → "op-sqlite": { "sqlcipher": true }). NFR-P2.
 */
import { open } from '@op-engineering/op-sqlite';
import { DatabaseProvider, SqlDatabase, SqlResult } from './ports';

const DB_NAME = 'inward.db';

export const opSqliteProvider: DatabaseProvider = {
  async open(encryptionKey: string): Promise<SqlDatabase> {
    const db = open({ name: DB_NAME, encryptionKey });
    return {
      async execute(sql: string, params: unknown[] = []): Promise<SqlResult> {
        const result = await db.execute(sql, params as never[]);
        return { rows: (result.rows ?? []) as Record<string, unknown>[] };
      },
      async close(): Promise<void> {
        db.close();
      },
    };
  },

  async deleteDatabase(): Promise<void> {
    // op-sqlite removes the file via the instance's delete(); the key needed to
    // open it here is irrelevant for deletion but required by the API, so we
    // open with a throwaway handle scoped to this call. Verified on device in M1.
    const db = open({ name: DB_NAME, encryptionKey: 'erase' });
    db.delete();
  },
};
