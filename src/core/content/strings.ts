/**
 * Externalized interface strings (NFR-X2): EN + SK at launch, bundle-level
 * replaceable later (02 §Content localization). The catalog pattern: every
 * room migrates its copy here; `t` falls back to English so a missing
 * translation is a gap, never a crash. Copy voice rules (06 §Copy) apply to
 * every locale equally — kind, plain, unhurried, no urgency.
 */

const en = {
  'threshold.quietLine': 'The day is on the other side of this screen.',
  'threshold.morningCompass': 'the morning compass',
  'threshold.eveningCompass': 'the evening compass',
  'threshold.opening': 'today’s opening',
  'threshold.reading': 'one deep thing',
  'threshold.path': 'a path',
  'threshold.quizzes': 'the quizzes',
  'threshold.craving': 'i feel the pull',
  'threshold.realign': 'the weekly realignment',
  'threshold.mirror': 'the mirror',
  'threshold.untangling': 'the untangling',
  'threshold.redesign': 'redesign the phone',
  'threshold.build': 'build one thing',
  'threshold.unplug': 'unplug',
  'threshold.detox': 'dopamine detox',
  'threshold.journal': 'the journal',
  'threshold.settings': 'settings',
} as const;

export type StringKey = keyof typeof en;

const sk: Partial<Record<StringKey, string>> = {
  'threshold.quietLine': 'Deň je na druhej strane tejto obrazovky.',
  'threshold.morningCompass': 'ranný kompas',
  'threshold.eveningCompass': 'večerný kompas',
  'threshold.opening': 'dnešné otvorenie',
  'threshold.reading': 'jedna hlboká vec',
  'threshold.path': 'cesta',
  'threshold.quizzes': 'kvízy',
  'threshold.craving': 'cítim to nutkanie',
  'threshold.realign': 'týždenné zrovnanie',
  'threshold.mirror': 'zrkadlo',
  'threshold.untangling': 'rozplietanie',
  'threshold.redesign': 'upokojiť telefón',
  'threshold.build': 'vytvor jednu vec',
  'threshold.unplug': 'odpojiť sa',
  'threshold.detox': 'dopamínový pôst',
  'threshold.journal': 'denník',
  'threshold.settings': 'nastavenia',
};

const CATALOGS: Record<string, Partial<Record<StringKey, string>>> = { en, sk };

/** Locale string, falling back to English — a gap, never a crash (NFR-X2). */
export function t(key: StringKey, locale: string): string {
  const language = locale.toLowerCase().split(/[-_]/)[0];
  return CATALOGS[language]?.[key] ?? en[key];
}
