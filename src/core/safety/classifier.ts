/**
 * core/safety — the on-device crisis classifier (SAFE-01). Screens free text
 * (intake chat / Companion input, M4) and structured intake answers. Runs
 * entirely on-device, before any other handling — including before any remote
 * call (02 §Companion privacy gateway).
 *
 * This is a transparent lexicon classifier, deliberately biased toward
 * sensitivity: a false help screen costs a moment; a miss can cost far more.
 * The lexicon is versioned content (extended per locale with the bundle).
 */
import { ChannelKey, PULL_ITEM_MAX } from '../scoring/config';
import { IntakeResponse } from '../../app/mirror/intakeRepo';

export type CrisisKind = 'self_harm' | 'acute_distress' | 'addiction_severity';

export interface CrisisSignal {
  triggered: boolean;
  kind: CrisisKind | null;
}

const NONE: CrisisSignal = { triggered: false, kind: null };

/** Phrase patterns, EN + SK launch locales (02 §Content localization). */
const SELF_HARM_PATTERNS: RegExp[] = [
  /\bkill(ing)? myself\b/i,
  /\bsuicid/i,
  /\bend (it all|my life)\b/i,
  /\b(want|wanted|wish) to die\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bself[- ]?harm/i,
  /\bno reason to (live|go on)\b/i,
  /\bbetter off without me\b/i,
  /\bnechcem (tu )?žiť\b/i,
  // Slovak reflexives appear in both orders: "zabijem sa" / "sa zabijem".
  /\bzabi(ť|jem)\s+sa\b/i,
  /\bsa\s+zabi(ť|jem)\b/i,
  /\bublíž(im|iť)\s+si\b/i,
  /\bsi\s+ublíž(im|iť)\b/i,
];

const DISTRESS_PATTERNS: RegExp[] = [
  /\bcan'?t (go on|take (it|this) anymore)\b/i,
  /\b(completely|totally) hopeless\b/i,
  /\bfalling apart\b/i,
  /\bnobody would (care|notice|miss me)\b/i,
  /\bnezvládam( to)?\b/i,
  /\buž nevládzem\b/i,
];

/** SAFE-01: screen one piece of free text. */
export function classifyText(text: string): CrisisSignal {
  if (SELF_HARM_PATTERNS.some((p) => p.test(text))) {
    return { triggered: true, kind: 'self_harm' };
  }
  if (DISTRESS_PATTERNS.some((p) => p.test(text))) {
    return { triggered: true, kind: 'acute_distress' };
  }
  return NONE;
}

/** Channels whose severity patterns route to professional help (SAFE-01). */
export const SEVERITY_CHANNELS: ChannelKey[] = ['substances', 'betting', 'porn'];

/**
 * Answered pull items at or above this mean (0–100) suggest a severity that
 * belongs with professionals before any product feature (SAFE-03).
 */
export const SEVERITY_PULL_MEAN = 75;

/** SAFE-03: severity patterns in intake answers gate the Portrait. */
export function severityGate(responses: IntakeResponse[]): CrisisSignal {
  for (const channel of SEVERITY_CHANNELS) {
    const pulls = responses.filter(
      (r) => r.channelKey === channel && r.dimension === 'pull' && !r.skipped,
    );
    if (pulls.length === 0) continue;
    const mean = pulls.reduce((sum, r) => sum + r.normalized, 0) / pulls.length;
    if (mean >= SEVERITY_PULL_MEAN) {
      return { triggered: true, kind: 'addiction_severity' };
    }
  }
  return NONE;
}

/** Sanity guard used by tests: the scale the gate reasons over. */
export const PULL_SCALE_MAX = (PULL_ITEM_MAX / PULL_ITEM_MAX) * 100;
