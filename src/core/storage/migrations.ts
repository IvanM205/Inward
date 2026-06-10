/**
 * Schema migrations — plain ordered SQL applied by a tiny versioned runner
 * (ADR-001). All tables live in the encrypted on-device DB (03-data-model);
 * no entity is ever transmitted off-device.
 */

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      // Profile — singleton row (03 §Profile).
      `CREATE TABLE profile (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        display_name TEXT,
        chosen_values TEXT NOT NULL DEFAULT '[]',
        morning_hour TEXT NOT NULL DEFAULT '07:30',
        evening_hour TEXT NOT NULL DEFAULT '21:30',
        locale TEXT NOT NULL DEFAULT 'en',
        onboarding_state TEXT NOT NULL DEFAULT 'breath_done'
          CHECK (onboarding_state IN (
            'breath_done','sentence_done','permissions_done','intake_in_progress',
            'intake_done','portrait_seen','thread_chosen','complete'))
      )`,
      // Channel — static, seeded (03 §Channel); canonical order fixed (01).
      `CREATE TABLE channel (
        key TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL UNIQUE,
        mechanism_copy_id TEXT NOT NULL
      )`,
    ],
  },
];

/** The twelve channels — canonical list, order fixed (01-product-overview). */
export const CHANNELS: { key: string; name: string; order: number }[] = [
  { key: 'feeds', name: 'Feeds & shorts', order: 1 },
  { key: 'series', name: 'Series & streaming', order: 2 },
  { key: 'games', name: 'Games & loot mechanics', order: 3 },
  { key: 'betting', name: 'Betting & speculation', order: 4 },
  { key: 'porn', name: 'Pornography & boundary-less sex', order: 5 },
  { key: 'substances', name: 'Substances', order: 6 },
  { key: 'nightlife', name: 'Nightlife & engineered fun', order: 7 },
  { key: 'shopping', name: 'Shopping & materialism', order: 8 },
  { key: 'outsourced_thinking', name: 'Outsourced thinking', order: 9 },
  { key: 'abandoned_skills', name: 'Abandoned skills', order: 10 },
  { key: 'spectator', name: 'Spectator life', order: 11 },
  { key: 'relationships', name: 'Starved relationships', order: 12 },
];

export async function applyMigrations(
  db: { execute(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> },
): Promise<void> {
  await db.execute(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)',
  );
  const result = await db.execute('SELECT MAX(version) AS v FROM schema_version');
  const current = Number(result.rows[0]?.v ?? 0);

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    for (const statement of migration.statements) {
      await db.execute(statement);
    }
    await db.execute('INSERT INTO schema_version (version) VALUES (?)', [migration.version]);
  }

  for (const c of CHANNELS) {
    await db.execute(
      'INSERT OR IGNORE INTO channel (key, name, "order", mechanism_copy_id) VALUES (?, ?, ?, ?)',
      [c.key, c.name, c.order, `mechanism.${c.key}`],
    );
  }
}
