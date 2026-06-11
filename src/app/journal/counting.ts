/**
 * Journal counting rules (04 §2.2) — pure functions deciding WHETHER an entry
 * counts toward the evidence offset. Saving is never gated: non-counted
 * entries are kept and shown gently — "written for the soul, not the score"
 * (JRN-04). The rule itself is disclosed openly in Settings (NFR-P5).
 */
import {
  SIMILARITY_THRESHOLD,
  SPECIFICITY_MIN_WORDS,
} from '../../core/scoring/config';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she',
  'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those',
  'and', 'or', 'but', 'so', 'because', 'if', 'then', 'than', 'as', 'of', 'to',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'from', 'into', 'over',
  'after', 'before', 'again', 'very', 'really', 'just', 'too', 'also', 'not',
  'no', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does',
  'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should',
  'today', 'yesterday', 'something', 'someone', 'thing', 'things', 'good',
  'nice', 'great', 'day',
]);

/** Common irregular past forms — the heuristic's verb signal (04 §2.2). */
const IRREGULAR_PAST = new Set([
  'went', 'made', 'took', 'gave', 'got', 'saw', 'said', 'told', 'wrote',
  'met', 'sat', 'held', 'kept', 'left', 'ran', 'rang', 'sang', 'spoke',
  'stood', 'ate', 'drank', 'drove', 'rode', 'swam', 'slept', 'woke', 'built',
  'bought', 'brought', 'thought', 'taught', 'caught', 'felt', 'found', 'sent',
  'spent', 'lent', 'read', 'led', 'heard', 'paid', 'laid', 'put', 'let',
  'came', 'began', 'chose', 'broke', 'wore', 'threw', 'grew', 'knew', 'drew',
  'flew', 'forgave', 'gathered', 'lit', 'sewed', 'dug', 'hugged', 'wrote',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function looksPastTense(word: string): boolean {
  if (IRREGULAR_PAST.has(word)) return true;
  // -ed past forms; length guard keeps short nouns (bed, red) out.
  return word.length >= 5 && word.endsWith('ed');
}

/**
 * Specificity rule (04 §2.2): concrete = named person/place/object/event.
 * Heuristic exactly as specced: ≥ SPECIFICITY_MIN_WORDS words, a past-tense
 * verb, and a non-stopword noun-ish token besides that verb. A capitalized
 * mid-sentence word (a name) also satisfies the noun requirement.
 */
export function isSpecific(text: string): boolean {
  const words = tokenize(text);
  if (words.length < SPECIFICITY_MIN_WORDS) return false;

  const pastVerbs = words.filter(looksPastTense);
  if (pastVerbs.length === 0) return false;

  const rawWords = text.split(/\s+/).filter((w) => w.length > 0);
  const hasMidSentenceName = rawWords.some(
    (w, i) => i > 0 && /^[A-Z][a-zà-ž]+/.test(w) && !/[.!?]$/.test(rawWords[i - 1] ?? ''),
  );
  const hasConcreteToken = words.some(
    (w) => !STOPWORDS.has(w) && !looksPastTense(w) && w.length >= 3,
  );
  return hasMidSentenceName || hasConcreteToken;
}

/** Token Jaccard similarity — the on-device duplicate signal (04 §2.2). */
export function tokenJaccard(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Diminishing returns (04 §2.2): the 0-based count of near-duplicates among
 * entries from the trailing 14 days ⇒ weight × 0.5^n for the nth repeat.
 */
export function repeatIndex(text: string, recentTexts: string[]): number {
  return recentTexts.filter((prior) => tokenJaccard(text, prior) >= SIMILARITY_THRESHOLD).length;
}
