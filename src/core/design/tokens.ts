/**
 * Design tokens — the complete palette and rhythm of Inward (06-design-system).
 * These are the only colors in the product. No success-green, no error-red:
 * errors are written in words (06 §Color).
 */

export const color = {
  /** Ground/background (light). */
  paper: '#F7F3EC',
  /** Primary text — near-black, never pure #000 on paper. */
  ink: '#1D1A16',
  /** Secondary text, quiet UI. */
  stone: '#56504A',
  /** Hairlines, dividers, borders. */
  mist: '#D9D2C5',
  /** The single accent — max ONE use per screen (06 §Color). */
  bronze: '#9A7748',
  /** The Quiet, wind-down, terminal screens. */
  night: '#0E0C0A',
  /** Text on night. */
  nightText: '#C9C2B4',
} as const;

/**
 * Two voices (06 §Typography):
 * serif — the soul voice: readings, questions, reflections, Companion, long-form.
 * sans  — the interface voice: labels only, letter-spaced uppercase at small sizes.
 * Font files land in M1 asset work; family names are the single point of change.
 */
export const font = {
  serif: 'SourceSerif4-Regular',
  serifItalic: 'SourceSerif4-It',
  sans: 'Inter-Regular',
} as const;

export const type = {
  /** Body serif 18–21pt, line-height ≥ 1.6. */
  body: { fontFamily: font.serif, fontSize: 19, lineHeight: 32 },
  /** The one serif line on terminal/night screens. */
  terminalLine: { fontFamily: font.serif, fontSize: 22, lineHeight: 36 },
  question: { fontFamily: font.serif, fontSize: 24, lineHeight: 40 },
  /** Interface labels: small sans, uppercase, tracked +8–12%. */
  label: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, letterSpacing: 1.3 },
} as const;

/** 8-dp grid (06 §Spacing). */
export const space = {
  x1: 8,
  x2: 16,
  x3: 24,
  x4: 32,
  x6: 48,
  x8: 64,
  /** Generous reading margins, ≥ 24 dp. */
  readingMargin: 28,
} as const;

/**
 * Motion (06 §Motion): 300–600 ms, ease-in-out, breath-paced. Nothing snaps,
 * bounces, or celebrates. Honor reduced-motion by replacing fades with stillness.
 */
export const motion = {
  fast: 300,
  slow: 600,
  /** Breathing animation rhythm (ONB-01, CRAVE-02): 4 s in / 6 s out. */
  breathInMs: 4000,
  breathOutMs: 6000,
} as const;

/** Touch targets ≥ 44 pt (06 §Accessibility). */
export const touchTarget = 44;
