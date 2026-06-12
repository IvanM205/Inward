/**
 * The content bundle pipeline (02 §Content pipeline, NFR-R2).
 *
 * All Library content ships as versioned, editor-curated, SIGNED bundles.
 * This module owns the rules: a bundle is parsed, its signature verified,
 * its shape validated — and only then activated. Any failure at any step
 * leaves the embedded fallback in place. A malformed bundle is never a
 * crash; it is a non-event.
 *
 * Scoring weights deliberately do NOT live in bundles (threat model T2):
 * a bundle can bring words, never arithmetic.
 */
import { dareLadderFor, DARE_TEMPLATES } from './dareTemplates';
import { PATHS, Path } from './paths';
import { QUESTION_BANK, IntakeQuestion } from './questionBank';
import { READINGS, Reading } from './readings';

export interface ContentBundle {
  bundleVersion: string;
  locale: string;
  readings: Reading[];
  paths: Path[];
  intakeQuestions: IntakeQuestion[];
  dareTemplates: Record<string, string[]>;
}

/** Verifies bundle bytes against their detached signature (native crypto). */
export interface SignatureVerifier {
  verify(payload: string, signature: string): boolean;
}

/** The embedded fallback — first run works offline, forever (02 §Content). */
export function fallbackBundle(): ContentBundle {
  return {
    bundleVersion: '2026.06.1-embedded',
    locale: 'en',
    readings: READINGS,
    paths: PATHS,
    intakeQuestions: QUESTION_BANK,
    dareTemplates: Object.fromEntries(
      Object.keys(DARE_TEMPLATES).map((key) => [key, dareLadderFor(key as never)]),
    ),
  };
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/** Structural validation — returns null instead of ever throwing. */
export function validateBundle(raw: unknown): ContentBundle | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (!isNonEmptyString(b.bundleVersion) || !isNonEmptyString(b.locale)) return null;
  if (!Array.isArray(b.readings) || !Array.isArray(b.paths) || !Array.isArray(b.intakeQuestions)) {
    return null;
  }
  for (const r of b.readings as unknown[]) {
    const reading = r as Partial<Reading>;
    if (
      !isNonEmptyString(reading.id) ||
      !isNonEmptyString(reading.title) ||
      !Array.isArray(reading.body) ||
      reading.body.length === 0 ||
      !isNonEmptyString(reading.closingQuestion)
    ) {
      return null;
    }
  }
  const readingIds = new Set((b.readings as Reading[]).map((r) => r.id));
  for (const p of b.paths as unknown[]) {
    const path = p as Partial<Path>;
    if (!isNonEmptyString(path.id) || !Array.isArray(path.days) || path.days.length < 7 || path.days.length > 14) {
      return null;
    }
    for (const day of path.days) {
      if (!readingIds.has(day.readingId)) return null; // a path may not point into the void
    }
  }
  return {
    bundleVersion: b.bundleVersion,
    locale: b.locale,
    readings: b.readings as Reading[],
    paths: b.paths as Path[],
    intakeQuestions: b.intakeQuestions as IntakeQuestion[],
    dareTemplates: (b.dareTemplates as Record<string, string[]>) ?? {},
  };
}

let active: ContentBundle = fallbackBundle();

export function activeBundle(): ContentBundle {
  return active;
}

export type BundleLoadResult = 'activated' | 'rejected_signature' | 'rejected_shape' | 'rejected_parse';

/**
 * The only door for OTA content (NFR-R2): parse → verify → validate →
 * activate. Every failure path returns a reason and keeps the fallback (or
 * the previously activated bundle) — never a throw, never a partial state.
 */
export function loadBundle(
  payload: string,
  signature: string,
  verifier: SignatureVerifier,
): BundleLoadResult {
  if (!verifier.verify(payload, signature)) return 'rejected_signature';
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return 'rejected_parse';
  }
  const bundle = validateBundle(parsed);
  if (!bundle) return 'rejected_shape';
  active = bundle;
  return 'activated';
}

/** Test/erase hook: return to the embedded fallback. */
export function resetToFallback(): void {
  active = fallbackBundle();
}
