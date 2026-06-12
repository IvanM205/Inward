/**
 * Adaptive intake (ONB-04): ~24–40 questions instead of all 84. The quiz
 * screens every channel with its one time question first; only channels whose
 * answer suggests real capture are deepened with the five pull items and the
 * displacement checklist. Skipped screeners still deepen — refusing to answer
 * is not a verdict (every question skippable, no penalty).
 *
 * Pure: pass what has been seen and answered, get the next question or null.
 */
import { IntakeQuestion, QUESTION_BANK } from '../../core/content/questionBank';
import { ChannelKey } from '../../core/scoring/config';
import { IntakeResponse } from './intakeRepo';

/** Hard cap on questions asked in one intake (ONB-04: ~24–40, ≈15 min). */
export const QUESTION_CAP = 40;

/** Deepen a channel when its time screener normalizes to at least this. */
export const DEEPEN_THRESHOLD = 40;

const timeQuestions = QUESTION_BANK.filter((q) => q.dimension === 'time');

function deepenQuestions(channel: ChannelKey): IntakeQuestion[] {
  return QUESTION_BANK.filter(
    (q) => q.channelKey === channel && q.dimension !== 'time',
  );
}

/**
 * The next question to ask, or null when the intake is complete (all due
 * questions seen, or the cap reached). `seen` covers answered AND skipped —
 * nothing is ever re-asked within one intake.
 */
export function nextQuestion(
  seen: Set<string>,
  responses: IntakeResponse[],
): IntakeQuestion | null {
  if (seen.size >= QUESTION_CAP) return null;

  // Phase 1 — screen every channel with its time question.
  const unseenScreener = timeQuestions.find((q) => !seen.has(q.id));
  if (unseenScreener) return unseenScreener;

  // Phase 2 — deepen channels that screened hot, or whose screener was
  // skipped (a skip hides, it does not clear).
  const byQuestion = new Map(responses.map((r) => [r.questionId, r]));
  for (const screener of timeQuestions) {
    const response = byQuestion.get(screener.id);
    const deepen = !response || response.skipped || response.normalized >= DEEPEN_THRESHOLD;
    if (!deepen) continue;
    const next = deepenQuestions(screener.channelKey).find((q) => !seen.has(q.id));
    if (next) return next;
  }
  return null;
}
