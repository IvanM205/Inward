/**
 * "How the score works" (NFR-P5, JRN-04) — full transparency: weights, caps,
 * smoothing, counting rules. Every number here is INTERPOLATED from
 * core/scoring/config — what is configured is exactly what is disclosed, so
 * the page can never drift from the engine.
 */
import { PULL_ITEMS } from '../../core/content/questionBank';
import {
  BANDS,
  CROSS_CHANNEL_FACTOR,
  DAILY_COUNTED_CAP,
  DIMENSION_WEIGHTS,
  DISPLACEMENT_WEIGHTS,
  ENTRY_WEIGHTS,
  EVIDENCE_OFFSET_CAP,
  EVIDENCE_WINDOW_DAYS,
  REPEAT_DECAY,
  SIMILARITY_WINDOW_DAYS,
  SMOOTHING_WEEKS,
  SPECIFICITY_MIN_WORDS,
} from '../../core/scoring/config';

export interface DisclosureSection {
  title: string;
  body: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function scoreDisclosure(): DisclosureSection[] {
  return [
    {
      title: 'what the index is',
      body:
        `Each channel gets a capture score from 0 to 100, built from three parts: ` +
        `time (${pct(DIMENSION_WEIGHTS.time)}), pull (${pct(DIMENSION_WEIGHTS.pull)}), ` +
        `and what it displaces (${pct(DIMENSION_WEIGHTS.displacement)}). ` +
        `Nothing else feeds it. No score ever changes what the app offers you.`,
    },
    {
      title: 'time',
      body:
        'Your weekly hours, from your own answer — or from measured screen time ' +
        'if you allowed it (the measurement wins over the guess). Each channel ' +
        'has its own thresholds; more hours, higher score.',
    },
    {
      title: 'pull',
      body:
        `Five plain questions per channel, each answered never to always:\n` +
        PULL_ITEMS.map((item) => `— ${item.toLowerCase()}`).join('\n'),
    },
    {
      title: 'what it displaces',
      body:
        `Named casualties add fixed weights: sleep ${DISPLACEMENT_WEIGHTS.sleep}, ` +
        `a close relationship ${DISPLACEMENT_WEIGHTS.close_relationship}, ` +
        `money ${DISPLACEMENT_WEIGHTS.finances}, a skill ${DISPLACEMENT_WEIGHTS.skill_craft}, ` +
        `your body ${DISPLACEMENT_WEIGHTS.body_outdoors}, ` +
        `meals with people ${DISPLACEMENT_WEIGHTS.meals_with_people}.`,
    },
    {
      title: 'how living lowers it',
      body:
        `Counted journal entries push a channel's score down — kindness ` +
        `${ENTRY_WEIGHTS.kindness}, care ${ENTRY_WEIGHTS.care}, aliveness ` +
        `${ENTRY_WEIGHTS.aliveness}, a finished dare ${ENTRY_WEIGHTS.dare_done}, ` +
        `a decoded craving ${ENTRY_WEIGHTS.craving_decoded}, gratitude ` +
        `${ENTRY_WEIGHTS.gratitude} — over the trailing ${EVIDENCE_WINDOW_DAYS} days, ` +
        `capped at ${EVIDENCE_OFFSET_CAP} points per channel. Entries about other ` +
        `channels count at ${pct(CROSS_CHANNEL_FACTOR)}.`,
    },
    {
      title: 'what counts',
      body:
        `An entry counts when it is concrete — a named person, place, or thing, ` +
        `something that happened, at least ${SPECIFICITY_MIN_WORDS} words. At most ` +
        `${DAILY_COUNTED_CAP} entries count per day, one per kind for the ones you ` +
        `write by hand. Repeating yourself within ${SIMILARITY_WINDOW_DAYS} days ` +
        `halves the weight each time (×${REPEAT_DECAY}). Entries that do not count ` +
        `are still kept — written for the soul, not the score.`,
    },
    {
      title: 'smoothing and bands',
      body:
        `Scores are averaged over the last ${SMOOTHING_WEEKS} weeks, so one loud ` +
        `week is not a verdict. Bands: free up to ${BANDS.free.max}, leaking up to ` +
        `${BANDS.leaking.max}, caught above that. The headline level weighs the ` +
        `deepest captures most.`,
    },
    {
      title: 'what never happens',
      body:
        'The index never leaves this device. It is never used to time, tempt, ' +
        'or sell anything. Erasing your data erases it entirely.',
    },
  ];
}
