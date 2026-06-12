/**
 * Open Hand state and ask rules (OPEN-01..03, 03 §OpenHandState).
 * Everything is free and identical for everyone (INV-8); the ask is a quiet
 * monthly possibility, never pressure. These rules are the covenant's
 * enforcement, so they live as one pure, tested function.
 */
import { SqlDatabase } from '../../core/storage/ports';
import { toLocalIso } from '../../core/storage/time';

export interface OpenHandState {
  lastAskShownAt: string | null;
  lastContributionAt: string | null;
  declinedUntil: string | null;
}

export interface AskMoment {
  /** The ask may only follow a finished dare or reading (OPEN-02). */
  justCompleted: 'dare' | 'reading' | null;
  inCraving: boolean;
  inQuiet: boolean;
  inOnboarding: boolean;
}

export async function openHandState(db: SqlDatabase): Promise<OpenHandState> {
  const result = await db.execute('SELECT * FROM open_hand_state WHERE id = 1');
  const row = result.rows[0] ?? {};
  return {
    lastAskShownAt: row.last_ask_shown_at ? String(row.last_ask_shown_at) : null,
    lastContributionAt: row.last_contribution_at ? String(row.last_contribution_at) : null,
    declinedUntil: row.declined_until ? String(row.declined_until) : null,
  };
}

function sameMonth(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const then = new Date(iso);
  return then.getFullYear() === now.getFullYear() && then.getMonth() === now.getMonth();
}

/** The whole of OPEN-02, as one answer. */
export function askAllowed(state: OpenHandState, moment: AskMoment, now: Date): boolean {
  if (moment.justCompleted === null) return false; // only at a good moment
  if (moment.inCraving || moment.inQuiet || moment.inOnboarding) return false;
  if (sameMonth(state.lastAskShownAt, now)) return false; // max once a month
  if (sameMonth(state.lastContributionAt, now)) return false; // never ask a giver twice
  if (state.declinedUntil !== null && new Date(state.declinedUntil).getTime() > now.getTime()) {
    return false; // a decline holds for thirty days
  }
  return true;
}

export async function markAskShown(db: SqlDatabase, now: Date): Promise<void> {
  await db.execute('UPDATE open_hand_state SET last_ask_shown_at = ? WHERE id = 1', [
    toLocalIso(now),
  ]);
}

/** One tap, thirty quiet days, zero guilt (OPEN-03). */
export async function markDeclined(db: SqlDatabase, now: Date): Promise<void> {
  const until = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  await db.execute('UPDATE open_hand_state SET declined_until = ? WHERE id = 1', [
    toLocalIso(until),
  ]);
}

export async function markContributed(db: SqlDatabase, now: Date): Promise<void> {
  await db.execute('UPDATE open_hand_state SET last_contribution_at = ? WHERE id = 1', [
    toLocalIso(now),
  ]);
}

/** OPEN-04: the single anonymous network counter in the whole app. */
export interface SupporterCountSource {
  fetch(): Promise<number | null>;
}
