/**
 * The attention-audit funnel quiz (LIB-04): five channel-free questions, a
 * coarse phrase for an answer. Its result is the ONLY shareable artifact in
 * the product (MIR-04, 04 §6) — opt-in, no numbers, no channels, no pitch.
 */

export const FUNNEL_QUESTIONS = [
  'The phone is in your hand before you notice deciding.',
  'Free minutes fill themselves with the screen.',
  'You have tried to cut down, and it did not hold.',
  'The evenings disappear faster than they used to.',
  'Quiet feels uncomfortable without something playing.',
] as const;

export const FUNNEL_SCALE_MAX = 4; // never → always, like the intake (04 §1.2)

export type FunnelVerdict = 'mostly yours' | 'on loan' | 'being farmed';

/** Coarse on purpose: a phrase, not a number (04 §6 anti-gaming). */
export function funnelVerdict(answers: number[]): FunnelVerdict {
  if (answers.length !== FUNNEL_QUESTIONS.length) {
    throw new Error(`The funnel asks exactly ${FUNNEL_QUESTIONS.length} questions.`);
  }
  for (const a of answers) {
    if (!Number.isInteger(a) || a < 0 || a > FUNNEL_SCALE_MAX) {
      throw new Error(`Answer out of range 0–${FUNNEL_SCALE_MAX}: ${a}`);
    }
  }
  const score = (answers.reduce((s, a) => s + a, 0) / (FUNNEL_QUESTIONS.length * FUNNEL_SCALE_MAX)) * 100;
  if (score <= 25) return 'mostly yours';
  if (score <= 60) return 'on loan';
  return 'being farmed';
}

/** Mercy framing per verdict, plus the one suggested next step (LIB-04). */
export function funnelResultCopy(verdict: FunnelVerdict): { line: string; nextStep: string } {
  switch (verdict) {
    case 'mostly yours':
      return {
        line: 'Your attention is mostly yours. That is rarer than it sounds.',
        nextStep: 'Keep one screen-free hour tomorrow, on purpose, to stay that way.',
      };
    case 'on loan':
      return {
        line: 'Your attention is on loan — some of it comes home, some does not.',
        nextStep: 'Pick the one app that keeps the most, and move it off your first screen tonight.',
      };
    case 'being farmed':
      return {
        line: 'Your attention is being farmed. Not a flaw in you — a design aimed at you.',
        nextStep: 'Tomorrow morning, keep the first half hour for yourself. Begin there.',
      };
  }
}

/** The opt-in share text: coarse, channel-free, no numbers, no pitch. */
export function funnelShareText(verdict: FunnelVerdict): string {
  return `I sat with five honest questions about my attention. The answer: ${verdict}.`;
}
