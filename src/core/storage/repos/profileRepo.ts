/**
 * Profile repository — the singleton row (03 §Profile). Holds onboarding
 * progress and the two compass hours (the ONLY notification schedule, INV-4).
 * No account, no email, no sign-in anywhere (ONB-05): the profile is created
 * silently on first launch and never leaves the device.
 */
import { newId } from '../ids';
import { SqlDatabase } from '../ports';
import { toLocalIso } from '../time';

export const ONBOARDING_STATES = [
  'breath_done',
  'sentence_done',
  'permissions_done',
  'intake_in_progress',
  'intake_done',
  'portrait_seen',
  'thread_chosen',
  'complete',
] as const;

export type OnboardingState = (typeof ONBOARDING_STATES)[number];

export interface Profile {
  id: string;
  createdAt: string;
  displayName: string | null;
  chosenValues: string[];
  /** "HH:MM" local — defaults 07:30 / 21:30 (THR-02/03). */
  morningHour: string;
  eveningHour: string;
  locale: string;
  onboardingState: OnboardingState;
  /**
   * Local date key of the last completed morning compass, or null. The only
   * record the morning leaves (ADR-004): the answer itself is never stored,
   * and no history accumulates.
   */
  morningDoneDate: string | null;
}

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    displayName: row.display_name === null ? null : String(row.display_name),
    chosenValues: JSON.parse(String(row.chosen_values)) as string[],
    morningHour: String(row.morning_hour),
    eveningHour: String(row.evening_hour),
    locale: String(row.locale),
    onboardingState: String(row.onboarding_state) as OnboardingState,
    morningDoneDate:
      row.morning_done_date === null || row.morning_done_date === undefined
        ? null
        : String(row.morning_done_date),
  };
}

export async function getProfile(db: SqlDatabase): Promise<Profile | null> {
  const result = await db.execute('SELECT * FROM profile LIMIT 1');
  const row = result.rows[0];
  return row ? rowToProfile(row) : null;
}

/** Returns the existing profile or creates the singleton row on first launch. */
export async function ensureProfile(db: SqlDatabase, now: Date): Promise<Profile> {
  const existing = await getProfile(db);
  if (existing) return existing;
  await db.execute(
    'INSERT INTO profile (id, created_at) VALUES (?, ?)',
    [newId(), toLocalIso(now)],
  );
  return (await getProfile(db))!;
}

export async function setOnboardingState(db: SqlDatabase, state: OnboardingState): Promise<void> {
  if (!ONBOARDING_STATES.includes(state)) {
    throw new Error(`Unknown onboarding state "${state}".`);
  }
  await db.execute('UPDATE profile SET onboarding_state = ?', [state]);
}

const HOUR_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** User-chosen compass hours — the only two notification slots (INV-4). */
export async function setCompassHours(
  db: SqlDatabase,
  morningHour: string,
  eveningHour: string,
): Promise<void> {
  for (const hour of [morningHour, eveningHour]) {
    if (!HOUR_PATTERN.test(hour)) throw new Error(`Invalid hour "${hour}" — expected "HH:MM".`);
  }
  await db.execute('UPDATE profile SET morning_hour = ?, evening_hour = ?', [
    morningHour,
    eveningHour,
  ]);
}

export async function setChosenValues(db: SqlDatabase, values: string[]): Promise<void> {
  await db.execute('UPDATE profile SET chosen_values = ?', [JSON.stringify(values)]);
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Records that the morning compass was completed on `date` so the Threshold
 * lets it rest for the day (THR-01/02). Overwrites the previous value —
 * yesterday's mark simply expires, it is never counted (INV-2).
 */
export async function markMorningDone(db: SqlDatabase, date: string): Promise<void> {
  if (!DATE_KEY_PATTERN.test(date)) {
    throw new Error(`Invalid date key "${date}" — expected "YYYY-MM-DD".`);
  }
  await db.execute('UPDATE profile SET morning_done_date = ?', [date]);
}
