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

export const FUNNEL_QUESTIONS_SK = [
  'Telefón máš v ruke skôr, než si všimneš rozhodnutie.',
  'Voľné minúty sa samy zaplnia obrazovkou.',
  'Skúšal si obmedziť, a nevydržalo to.',
  'Večery miznú rýchlejšie než kedysi.',
  'Ticho je nepríjemné, keď nič nehrá.',
] as const;

const isSk = (locale: string) => locale.toLowerCase().startsWith('sk');

export function funnelQuestionText(index: number, locale = 'en'): string {
  return isSk(locale) ? FUNNEL_QUESTIONS_SK[index] : FUNNEL_QUESTIONS[index];
}

const VERDICT_SK: Record<FunnelVerdict, string> = {
  'mostly yours': 'väčšinou tvoja',
  'on loan': 'požičaná',
  'being farmed': 'žne ju niekto iný',
};

/** Mercy framing per verdict, plus the one suggested next step (LIB-04). */
export function funnelResultCopy(
  verdict: FunnelVerdict,
  locale = 'en',
): { line: string; nextStep: string } {
  if (isSk(locale)) {
    switch (verdict) {
      case 'mostly yours':
        return {
          line: 'Tvoja pozornosť je väčšinou tvoja. To je vzácnejšie, než to znie.',
          nextStep: 'Zajtra si naschvál nechaj jednu hodinu bez obrazovky, aby to tak ostalo.',
        };
      case 'on loan':
        return {
          line: 'Tvoja pozornosť je požičaná — časť sa vracia, časť nie.',
          nextStep: 'Vyber appku, ktorá si necháva najviac, a dnes večer ju presuň z prvej obrazovky.',
        };
      case 'being farmed':
        return {
          line: 'Tvoju pozornosť žne niekto iný. Nie chyba v tebe — dizajn mierený na teba.',
          nextStep: 'Zajtra ráno si nechaj prvú polhodinu pre seba. Začni tam.',
        };
    }
  }
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
export function funnelShareText(verdict: FunnelVerdict, locale = 'en'): string {
  if (isSk(locale)) {
    return `Sadol som si k piatim úprimným otázkam o svojej pozornosti. Odpoveď: ${VERDICT_SK[verdict]}.`;
  }
  return `I sat with five honest questions about my attention. The answer: ${verdict}.`;
}
