/**
 * Storage ports — narrow interfaces over the native layers so the storage
 * logic (and the eraseAll covenant test, NFR-P4) runs against fakes in Jest
 * and against op-sqlite/Keychain on device.
 */

export interface SqlResult {
  rows: Record<string, unknown>[];
}

/** An OPEN encrypted database connection. */
export interface SqlDatabase {
  execute(sql: string, params?: unknown[]): Promise<SqlResult>;
  close(): Promise<void>;
}

/** Opens (creating if needed) the encrypted DB, and can destroy its file. */
export interface DatabaseProvider {
  open(encryptionKey: string): Promise<SqlDatabase>;
  /** Removes the database file itself — part of one-tap erasure (INV-6). */
  deleteDatabase(): Promise<void>;
}

/** iOS Keychain / Android Keystore wrapper for the SQLCipher key (NFR-P2). */
export interface KeyStore {
  /** Returns the existing key or generates and persists a new 256-bit one. */
  getOrCreateKey(): Promise<string>;
  deleteKey(): Promise<void>;
}

/** Clears every home/lock-screen widget (03 §Erasure). */
export interface WidgetSurface {
  clearAll(): Promise<void>;
}

/** The two-slot scheduler exposes cancelAll for erasure (INV-4 / INV-6). */
export interface NotificationCanceller {
  cancelAll(): Promise<void>;
}
