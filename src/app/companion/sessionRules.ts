/**
 * Session rules (COMP-03, 03 §CompanionSession): conversations end. The soft
 * close begins around twenty minutes; the other endings are the person's
 * own, the handoff to the world, or the crisis route. There is no rule
 * anywhere for bringing a person back.
 */

export const SOFT_CLOSE_AFTER_MS = 20 * 60 * 1000;

export type SessionEndReason = 'user' | 'soft_close' | 'handoff' | 'crisis_route';

/** Has the session reached the gentle-closing phase? */
export function softCloseDue(startedAt: Date, now: Date): boolean {
  return now.getTime() - startedAt.getTime() >= SOFT_CLOSE_AFTER_MS;
}
