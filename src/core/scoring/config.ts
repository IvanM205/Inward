/**
 * Scoring constants — ALL tunable numbers of the Extraction Index live here
 * so editors can adjust without code changes (04-scoring-spec preamble).
 * The "How the score works" page (NFR-P5) renders from this file: what is
 * configured here is exactly what is disclosed.
 */

export type ChannelKey =
  | 'feeds'
  | 'series'
  | 'games'
  | 'betting'
  | 'porn'
  | 'substances'
  | 'nightlife'
  | 'shopping'
  | 'outsourced_thinking'
  | 'abandoned_skills'
  | 'spectator'
  | 'relationships';

export const CHANNEL_KEYS: ChannelKey[] = [
  'feeds', 'series', 'games', 'betting', 'porn', 'substances', 'nightlife',
  'shopping', 'outsourced_thinking', 'abandoned_skills', 'spectator', 'relationships',
];

/** raw_capture = 0.35·time + 0.40·pull + 0.25·displacement (04 §1). */
export const DIMENSION_WEIGHTS = { time: 0.35, pull: 0.4, displacement: 0.25 } as const;

/**
 * time_score thresholds, hours/week → score, piecewise-linear through
 * T0(→0), T40(→40), T70(→70), Tsat(→100) (04 §1.1). Defaults below follow the
 * spec's feeds example; per-channel tuning is editorial.
 */
export interface TimeThresholds {
  t0: number;
  t40: number;
  t70: number;
  tsat: number;
}

const DEFAULT_TIME_THRESHOLDS: TimeThresholds = { t0: 2, t40: 7, t70: 14, tsat: 25 };

export const TIME_THRESHOLDS: Record<ChannelKey, TimeThresholds> = {
  feeds: { t0: 2, t40: 7, t70: 14, tsat: 25 },
  series: { t0: 3, t40: 9, t70: 16, tsat: 28 },
  games: { t0: 2, t40: 7, t70: 14, tsat: 25 },
  betting: { t0: 0.5, t40: 3, t70: 7, tsat: 14 },
  porn: { t0: 0.5, t40: 3, t70: 7, tsat: 14 },
  substances: { t0: 1, t40: 5, t70: 10, tsat: 20 },
  nightlife: { t0: 4, t40: 10, t70: 18, tsat: 30 },
  shopping: { t0: 2, t40: 6, t70: 12, tsat: 20 },
  outsourced_thinking: DEFAULT_TIME_THRESHOLDS,
  abandoned_skills: DEFAULT_TIME_THRESHOLDS,
  spectator: { t0: 3, t40: 9, t70: 16, tsat: 28 },
  relationships: DEFAULT_TIME_THRESHOLDS,
};

/** Five Likert items 0–4 per channel; pull_self = sum/20·100 (04 §1.2). */
export const PULL_ITEM_COUNT = 5;
export const PULL_ITEM_MAX = 4;

/**
 * Behavioral modifier (digital channels, permissioned only):
 * pull = clamp(pull_self + 0.5·pickup_z + 0.5·night_z + 0.5·overrun_z, 0, 100),
 * each z-term banded to −10..+10 (04 §1.2).
 */
export const BEHAVIORAL_TERM_WEIGHT = 0.5;
export const BEHAVIORAL_TERM_RANGE = 10;

/** Displacement casualty weights, capped at 100 (04 §1.3). */
export const DISPLACEMENT_WEIGHTS = {
  sleep: 25,
  close_relationship: 25,
  finances: 20,
  skill_craft: 10,
  body_outdoors: 10,
  meals_with_people: 10,
} as const;

export type Casualty = keyof typeof DISPLACEMENT_WEIGHTS;

/** Journal evidence offset: clamp(Σ counted weights over 28 days, 0, 10) (04 §2). */
export const EVIDENCE_WINDOW_DAYS = 28;
export const EVIDENCE_OFFSET_CAP = 10;

/** Entry base weights and channel mapping factors (04 §2.1). */
export const ENTRY_WEIGHTS = {
  kindness: 0.8,
  care: 0.6,
  aliveness: 0.6,
  dare_done: 1.0,
  craving_decoded: 0.5,
  gratitude: 0.3,
  path_reflection: 0.3,
} as const;

export type EntryType = keyof typeof ENTRY_WEIGHTS;

/** Channels where kindness/care apply at full weight; all others ×0.25 (04 §2.1). */
export const FULL_WEIGHT_CHANNELS: Partial<Record<EntryType, ChannelKey[]>> = {
  kindness: ['relationships'],
  care: ['feeds', 'substances', 'porn'],
};
export const CROSS_CHANNEL_FACTOR = 0.25;

/** Counting rules (04 §2.2). */
export const DAILY_COUNTED_CAP = 3;
export const SIMILARITY_THRESHOLD = 0.7;
export const SIMILARITY_WINDOW_DAYS = 14;
export const REPEAT_DECAY = 0.5;
export const SPECIFICITY_MIN_WORDS = 4;

/** Smoothing: mean of weekly raw_capture over trailing 4 weeks (04 §2.3). */
export const SMOOTHING_WEEKS = 4;

/** Bands (04 §3). */
export const BANDS = { free: { max: 25 }, leaking: { max: 60 }, caught: { max: 100 } } as const;
export type Band = keyof typeof BANDS;
