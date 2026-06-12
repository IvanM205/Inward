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
  'common.goOn': 'go on',
  'common.yes': 'yes',
  'common.notNow': 'not now',
  'common.skip': 'skip',
  'breath.invitation': 'breathe in… and out',
  'onb.sentence': 'You were not made to be harvested.',
  'onb.question': 'What would you give your attention to, if it were fully yours again?',
  'onb.questionHint': 'one line is enough',
  'onb.terminal': 'That is enough for today. Go live.',
  'morning.question': 'What will you give your attention to today?',
  'morning.questionHint': 'one line, or one word',
  'morning.openingLabel': 'today’s opening',
  'morning.noThread':
    'No thread is being loosened yet. Today is open — give it to what you just named.',
  'morning.iWill': 'i will',
  'morning.terminal': 'Now go give it your attention.',
  'evening.lean': 'Which way did today lean?',
  'evening.linePrompt': 'A line about it, if you wish.',
  'evening.gratitudeQuestion': 'What were you given today?',
  'evening.gratitudeHint': 'Up to three things — or none.',
  'evening.foldKindness': 'Was there a kindness in your day — given or received?',
  'evening.foldCare': 'Did you take care of something that matters?',
  'evening.foldAliveness': 'When did you feel most alive?',
  'evening.foldTheDay': 'fold the day',
  'evening.goodNight': 'good night',
  'evening.windDownFirst': 'wind down first',
  'evening.restTerminal': 'That is enough for today. Rest now.',
  'evening.sleepTerminal': 'The day is folded. Now sleep.',
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
  'common.goOn': 'ďalej',
  'common.yes': 'áno',
  'common.notNow': 'teraz nie',
  'common.skip': 'preskočiť',
  'breath.invitation': 'nádych… a výdych',
  'onb.sentence': 'Nebol si stvorený na to, aby ťa žali.',
  'onb.question': 'Čomu by si venoval svoju pozornosť, keby bola znova celá tvoja?',
  'onb.questionHint': 'stačí jeden riadok',
  'onb.terminal': 'Na dnes to stačí. Choď žiť.',
  'morning.question': 'Čomu dnes venuješ svoju pozornosť?',
  'morning.questionHint': 'jeden riadok, alebo jedno slovo',
  'morning.openingLabel': 'dnešné otvorenie',
  'morning.noThread':
    'Žiadna niť sa zatiaľ nerozplieta. Dnešok je otvorený — daj ho tomu, čo si práve pomenoval.',
  'morning.iWill': 'dám',
  'morning.terminal': 'Teraz tomu choď venovať svoju pozornosť.',
  'evening.lean': 'Na ktorú stranu sa dnešok naklonil?',
  'evening.linePrompt': 'Ak chceš, jeden riadok o tom.',
  'evening.gratitudeQuestion': 'Čo ti dnes bolo dané?',
  'evening.gratitudeHint': 'Najviac tri veci — alebo žiadna.',
  'evening.foldKindness': 'Bola v tvojom dni láskavosť — daná či prijatá?',
  'evening.foldCare': 'Postaral si sa o niečo, na čom záleží?',
  'evening.foldAliveness': 'Kedy si sa cítil najviac živý?',
  'evening.foldTheDay': 'zložiť deň',
  'evening.goodNight': 'dobrú noc',
  'evening.windDownFirst': 'najprv stíšenie',
  'evening.restTerminal': 'Na dnes to stačí. Teraz odpočívaj.',
  'evening.sleepTerminal': 'Deň je zložený. Teraz spi.',
};

const CATALOGS: Record<string, Partial<Record<StringKey, string>>> = { en, sk };

/** Locale string, falling back to English — a gap, never a crash (NFR-X2). */
export function t(key: StringKey, locale: string): string {
  const language = locale.toLowerCase().split(/[-_]/)[0];
  return CATALOGS[language]?.[key] ?? en[key];
}
