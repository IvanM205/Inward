/**
 * "How the score works" (NFR-P5, JRN-04) — full transparency: weights, caps,
 * smoothing, counting rules. Every number is INTERPOLATED from
 * core/scoring/config — what is configured is exactly what is disclosed, so
 * the page can never drift from the engine. The copy itself lives in the
 * string catalog (NFR-X2); the pull items remain bundle content.
 */
import { PULL_ITEMS } from '../../core/content/questionBank';
import { t, tf } from '../../core/content/strings';
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

export function scoreDisclosure(locale = 'en'): DisclosureSection[] {
  return [
    {
      title: t('disclosure.whatTitle', locale),
      body: tf('disclosure.whatBody', locale, {
        time: pct(DIMENSION_WEIGHTS.time),
        pull: pct(DIMENSION_WEIGHTS.pull),
        displacement: pct(DIMENSION_WEIGHTS.displacement),
      }),
    },
    {
      title: t('disclosure.timeTitle', locale),
      body: t('disclosure.timeBody', locale),
    },
    {
      title: t('disclosure.pullTitle', locale),
      body: tf('disclosure.pullBody', locale, {
        items: PULL_ITEMS.map((item) => `— ${item.toLowerCase()}`).join('\n'),
      }),
    },
    {
      title: t('disclosure.displacementTitle', locale),
      body: tf('disclosure.displacementBody', locale, {
        sleep: DISPLACEMENT_WEIGHTS.sleep,
        relationship: DISPLACEMENT_WEIGHTS.close_relationship,
        finances: DISPLACEMENT_WEIGHTS.finances,
        skill: DISPLACEMENT_WEIGHTS.skill_craft,
        body: DISPLACEMENT_WEIGHTS.body_outdoors,
        meals: DISPLACEMENT_WEIGHTS.meals_with_people,
      }),
    },
    {
      title: t('disclosure.evidenceTitle', locale),
      body: tf('disclosure.evidenceBody', locale, {
        kindness: ENTRY_WEIGHTS.kindness,
        care: ENTRY_WEIGHTS.care,
        aliveness: ENTRY_WEIGHTS.aliveness,
        dare: ENTRY_WEIGHTS.dare_done,
        craving: ENTRY_WEIGHTS.craving_decoded,
        gratitude: ENTRY_WEIGHTS.gratitude,
        window: EVIDENCE_WINDOW_DAYS,
        cap: EVIDENCE_OFFSET_CAP,
        cross: pct(CROSS_CHANNEL_FACTOR),
      }),
    },
    {
      title: t('disclosure.countingTitle', locale),
      body: tf('disclosure.countingBody', locale, {
        minWords: SPECIFICITY_MIN_WORDS,
        dailyCap: DAILY_COUNTED_CAP,
        similarDays: SIMILARITY_WINDOW_DAYS,
        decay: REPEAT_DECAY,
      }),
    },
    {
      title: t('disclosure.bandsTitle', locale),
      body: tf('disclosure.bandsBody', locale, {
        weeks: SMOOTHING_WEEKS,
        free: BANDS.free.max,
        leaking: BANDS.leaking.max,
      }),
    },
    {
      title: t('disclosure.neverTitle', locale),
      body: t('disclosure.neverBody', locale),
    },
  ];
}
