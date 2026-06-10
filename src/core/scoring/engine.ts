/**
 * core/scoring — the Extraction Index engine (04-scoring-spec).
 * Pure functions only: no IO, no dates read from the system, no storage.
 * Callers supply observations; the engine returns scores. 100% unit coverage
 * is a release requirement (NFR-R1).
 */
import {
  Band,
  BANDS,
  BEHAVIORAL_TERM_RANGE,
  BEHAVIORAL_TERM_WEIGHT,
  Casualty,
  ChannelKey,
  CROSS_CHANNEL_FACTOR,
  DIMENSION_WEIGHTS,
  DISPLACEMENT_WEIGHTS,
  ENTRY_WEIGHTS,
  EntryType,
  EVIDENCE_OFFSET_CAP,
  FULL_WEIGHT_CHANNELS,
  PULL_ITEM_COUNT,
  PULL_ITEM_MAX,
  REPEAT_DECAY,
  SMOOTHING_WEEKS,
  TIME_THRESHOLDS,
} from './config';

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/**
 * time_score: weekly hours → 0–100, piecewise-linear through the channel's
 * thresholds T0→0, T40→40, T70→70, Tsat→100 (04 §1.1). Observed screen time
 * wins over self-report for digital channels — the CALLER passes the winner.
 */
export function timeScore(channel: ChannelKey, hoursPerWeek: number): number {
  const { t0, t40, t70, tsat } = TIME_THRESHOLDS[channel];
  const h = Math.max(0, hoursPerWeek);
  if (h <= t0) return 0;
  if (h >= tsat) return 100;
  const segment = (from: number, to: number, sFrom: number, sTo: number) =>
    sFrom + ((h - from) / (to - from)) * (sTo - sFrom);
  if (h <= t40) return segment(t0, t40, 0, 40);
  if (h <= t70) return segment(t40, t70, 40, 70);
  return segment(t70, tsat, 70, 100);
}

export interface BehavioralSignals {
  /** Each banded z-term contributes −10..+10 (04 §1.2); caller derives bands from config thresholds. */
  pickupZ: number;
  nightZ: number;
  overrunZ: number;
}

/**
 * pull_score: five Likert items 0–4 → 0–100, plus the optional behavioral
 * modifier for permissioned digital channels (04 §1.2).
 */
export function pullScore(likertItems: number[], behavioral?: BehavioralSignals): number {
  if (likertItems.length !== PULL_ITEM_COUNT) {
    throw new Error(`pull_score expects exactly ${PULL_ITEM_COUNT} items, got ${likertItems.length}`);
  }
  for (const item of likertItems) {
    if (!Number.isFinite(item) || item < 0 || item > PULL_ITEM_MAX) {
      throw new Error(`Likert item out of range 0–${PULL_ITEM_MAX}: ${item}`);
    }
  }
  const self = (likertItems.reduce((a, b) => a + b, 0) / (PULL_ITEM_COUNT * PULL_ITEM_MAX)) * 100;
  if (!behavioral) return self;
  const z = (v: number) => clamp(v, -BEHAVIORAL_TERM_RANGE, BEHAVIORAL_TERM_RANGE);
  return clamp(
    self +
      BEHAVIORAL_TERM_WEIGHT * z(behavioral.pickupZ) +
      BEHAVIORAL_TERM_WEIGHT * z(behavioral.nightZ) +
      BEHAVIORAL_TERM_WEIGHT * z(behavioral.overrunZ),
    0,
    100,
  );
}

/** displacement_score: sum of named casualties, capped at 100 (04 §1.3). */
export function displacementScore(casualties: Casualty[]): number {
  const unique = [...new Set(casualties)];
  return clamp(unique.reduce((sum, c) => sum + DISPLACEMENT_WEIGHTS[c], 0), 0, 100);
}

/** raw_capture = 0.35·time + 0.40·pull + 0.25·displacement (04 §1). */
export function rawCapture(time: number, pull: number, displacement: number): number {
  for (const [name, v] of Object.entries({ time, pull, displacement })) {
    if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error(`${name} out of range 0–100: ${v}`);
  }
  return (
    DIMENSION_WEIGHTS.time * time +
    DIMENSION_WEIGHTS.pull * pull +
    DIMENSION_WEIGHTS.displacement * displacement
  );
}

export interface CountedEntry {
  type: EntryType;
  /** Channels this entry weighs against (auto-suggested, editable — 03 §JournalEntry). */
  channelKeys: ChannelKey[];
  /** 0-based count of near-duplicates in the trailing 14 days (04 §2.2). */
  repeatIndex: number;
}

/**
 * Weight of one COUNTED entry toward one channel (04 §2.1–2.2).
 * Counting rules (specificity, daily cap) decide WHETHER an entry counts —
 * that happens at save time in the journal module; here we only weigh.
 */
export function entryWeight(entry: CountedEntry, channel: ChannelKey): number {
  if (!entry.channelKeys.includes(channel)) return 0;
  const base = ENTRY_WEIGHTS[entry.type];
  const fullChannels = FULL_WEIGHT_CHANNELS[entry.type];
  const factor = fullChannels ? (fullChannels.includes(channel) ? 1 : CROSS_CHANNEL_FACTOR) : 1;
  const decay = REPEAT_DECAY ** Math.max(0, entry.repeatIndex);
  return base * factor * decay;
}

/** evidence_offset = clamp(Σ counted weights over trailing 28 days, 0, 10) (04 §2). */
export function evidenceOffset(entries: CountedEntry[], channel: ChannelKey): number {
  const sum = entries.reduce((acc, e) => acc + entryWeight(e, channel), 0);
  return clamp(sum, 0, EVIDENCE_OFFSET_CAP);
}

/** smoothed(x): mean of weekly raw_capture over trailing 4 weeks, min 1 (04 §2.3). */
export function smoothed(weeklyRawCaptures: number[]): number {
  if (weeklyRawCaptures.length === 0) {
    throw new Error('smoothed() needs at least one weekly raw_capture');
  }
  const window = weeklyRawCaptures.slice(-SMOOTHING_WEEKS);
  return window.reduce((a, b) => a + b, 0) / window.length;
}

/** effective = max(0, smoothed(raw) − evidence_offset) (04 §2). */
export function effectiveScore(smoothedRaw: number, offset: number): number {
  return Math.max(0, smoothedRaw - offset);
}

/** Bands: 0–25 free · 26–60 leaking · 61–100 caught (04 §3). */
export function band(score: number): Band {
  if (score < 0 || score > 100 || !Number.isFinite(score)) {
    throw new Error(`score out of range 0–100: ${score}`);
  }
  if (score <= BANDS.free.max) return 'free';
  if (score <= BANDS.leaking.max) return 'leaking';
  return 'caught';
}

/**
 * extraction_level = Σ eff·eff / Σ eff — score-weighted mean, so the deepest
 * captures dominate the headline; all-zero ⇒ 0 (04 §3).
 */
export function extractionLevel(effectiveScores: number[]): number {
  const total = effectiveScores.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const weighted = effectiveScores.reduce((a, b) => a + b * b, 0);
  return weighted / total;
}
