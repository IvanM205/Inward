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
  {
    version: 2,
    statements: [
      // Reflection — evening Compass (03 §Reflection); one per local date.
      // direction: −1.0 matter … +1.0 spirit; feeds the Needle (90-day window).
      `CREATE TABLE reflection (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        direction REAL NOT NULL CHECK (direction >= -1.0 AND direction <= 1.0),
        line TEXT,
        gratitudes TEXT NOT NULL DEFAULT '[]'
      )`,
      // JournalEntry — the Living Journal (03 §JournalEntry). repeat_index is a
      // local implementation detail: the 0-based near-duplicate count (04 §2.2)
      // so the scoring engine can rebuild exact per-channel weights at recalc.
      `CREATE TABLE journal_entry (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN (
          'kindness','care','aliveness','dare_done','craving_decoded',
          'path_reflection','gratitude')),
        text TEXT NOT NULL,
        channel_keys TEXT NOT NULL DEFAULT '[]',
        counted INTEGER NOT NULL DEFAULT 0,
        weight REAL NOT NULL DEFAULT 0,
        repeat_index INTEGER NOT NULL DEFAULT 0,
        origin TEXT NOT NULL CHECK (origin IN ('evening','widget','auto','companion'))
      )`,
      `CREATE INDEX journal_entry_created_at ON journal_entry (created_at)`,
    ],
  },
  {
    version: 3,
    statements: [
      // QuietState — singleton (03 §QuietState). M1 uses mode + unplug_until
      // (QUIET-01); detox and stillness JSON blobs fill in at M3.
      `CREATE TABLE quiet_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        mode TEXT NOT NULL DEFAULT 'none'
          CHECK (mode IN ('none','unplug','detox','stillness')),
        unplug_until TEXT,
        detox TEXT,
        stillness TEXT
      )`,
      `INSERT INTO quiet_state (id, mode) VALUES (1, 'none')`,
    ],
  },
  {
    version: 4,
    statements: [
      // Morning-done marker (THR-01/02, ADR-004): the local date the morning
      // compass was last completed — one overwritten value, no history, so
      // nothing can ever be counted or chained (INV-2). The morning answer
      // itself stays unstored (least data).
      `ALTER TABLE profile ADD COLUMN morning_done_date TEXT`,
    ],
  },
  {
    version: 5,
    statements: [
      // IntakeResponse (03 §IntakeResponse, ONB-04): one row per answered or
      // skipped question; normalized 0–100 computed at save time. Skipped
      // rows keep normalized at 0 and are excluded from scoring.
      `CREATE TABLE intake_response (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        question_id TEXT NOT NULL UNIQUE,
        channel_key TEXT NOT NULL REFERENCES channel(key),
        dimension TEXT NOT NULL CHECK (dimension IN ('time','pull','displacement')),
        raw_answer TEXT NOT NULL DEFAULT 'null',
        normalized REAL NOT NULL DEFAULT 0 CHECK (normalized >= 0 AND normalized <= 100),
        skipped INTEGER NOT NULL DEFAULT 0
      )`,
    ],
  },
  {
    version: 6,
    statements: [
      // ChannelScore — recomputed weekly, history kept (03 §ChannelScore).
      // One row per channel per week_index; re-running a week replaces it
      // (re-measure on demand, never more than 1×/week silently — 04 §4).
      `CREATE TABLE channel_score (
        id TEXT PRIMARY KEY,
        computed_at TEXT NOT NULL,
        week_index INTEGER NOT NULL,
        channel_key TEXT NOT NULL REFERENCES channel(key),
        time_score REAL NOT NULL,
        pull_score REAL NOT NULL,
        displacement_score REAL NOT NULL,
        raw_capture REAL NOT NULL,
        evidence_offset REAL NOT NULL CHECK (evidence_offset >= 0 AND evidence_offset <= 10),
        effective_score REAL NOT NULL,
        band TEXT NOT NULL CHECK (band IN ('free','leaking','caught')),
        explanation_refs TEXT NOT NULL DEFAULT '[]',
        UNIQUE (week_index, channel_key)
      )`,
      // ExtractionLevel — the headline, history kept (03 §ExtractionLevel).
      `CREATE TABLE extraction_level (
        id TEXT PRIMARY KEY,
        computed_at TEXT NOT NULL,
        week_index INTEGER NOT NULL UNIQUE,
        level REAL NOT NULL,
        band TEXT NOT NULL CHECK (band IN ('free','leaking','caught'))
      )`,
    ],
  },
  {
    version: 7,
    statements: [
      // Thread — the Liberation Plan (03 §Thread): one channel per season.
      // The partial unique index makes "exactly one active thread" (PLAN-01)
      // a database fact, not just repo discipline.
      `CREATE TABLE thread (
        id TEXT PRIMARY KEY,
        channel_key TEXT NOT NULL REFERENCES channel(key),
        started_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active','paused','graduated','abandoned')),
        replacement_habit TEXT,
        micro_act TEXT,
        weeks_held INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE UNIQUE INDEX thread_single_active ON thread (status) WHERE status = 'active'`,
    ],
  },
  {
    version: 8,
    statements: [
      // THR-04: the local date Today's Opening was last completed — one
      // overwritten value, no history, nothing countable (INV-2).
      `ALTER TABLE thread ADD COLUMN opening_done_on TEXT`,
    ],
  },
  {
    version: 9,
    statements: [
      // CravingEvent (03 §CravingEvent, CRAVE-01..03). channel_key is null
      // when no thread names the craving; the flow never demands one.
      `CREATE TABLE craving_event (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        channel_key TEXT REFERENCES channel(key),
        hunger TEXT NOT NULL
          CHECK (hunger IN ('connection','rest','meaning','body','unsure')),
        action_suggested TEXT NOT NULL,
        action_taken INTEGER,
        note TEXT
      )`,
    ],
  },
  {
    version: 10,
    statements: [
      // Dare — the 7-rung ladder (03 §Dare, PLAN-02). A skipped dare stays
      // skipped; nothing resets, the ladder waits (PLAN-04, INV-7).
      `CREATE TABLE dare (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES thread(id),
        rung INTEGER NOT NULL CHECK (rung BETWEEN 1 AND 7),
        text TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'template'
          CHECK (source IN ('template','custom','circle')),
        status TEXT NOT NULL DEFAULT 'waiting'
          CHECK (status IN ('waiting','offered','done','skipped')),
        offered_on TEXT,
        done_on TEXT,
        feeling_answer TEXT,
        UNIQUE (thread_id, rung)
      )`,
    ],
  },
  {
    version: 11,
    statements: [
      // PLAN-04 season accounting: weeks advance at most once per week_index
      // (idempotent weekly recalc), and graduation is celebrated exactly once.
      `ALTER TABLE thread ADD COLUMN last_week_advanced INTEGER`,
      `ALTER TABLE thread ADD COLUMN celebrate_pending INTEGER NOT NULL DEFAULT 0`,
    ],
  },
  {
    version: 12,
    statements: [
      // ReadingLog (03 §Reading, LIB-01): one row per reading per day read;
      // revisits capped at one per day — the archive is not a feed (INV-1).
      `CREATE TABLE reading_log (
        id TEXT PRIMARY KEY,
        reading_id TEXT NOT NULL,
        read_on TEXT NOT NULL,
        revisits INTEGER NOT NULL DEFAULT 0 CHECK (revisits <= 1),
        UNIQUE (reading_id, read_on)
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
