/**
 * The intake question bank (ONB-04, 02 §Content pipeline) — the embedded
 * fallback bundle so first run works fully offline. OTA-signed editorial
 * bundles can replace this; the shape follows 03 §Content bundle schema.
 *
 * The bank is generated, not hand-listed: 04-scoring-spec fixes the five
 * pull items word-for-word and the displacement casualty list, so every
 * channel asks the same honest questions about itself —
 * 12 channels × (1 time + 5 pull + 1 displacement) = 84 questions.
 */
import { CHANNEL_KEYS, ChannelKey, Casualty } from '../scoring/config';
import { CHANNELS } from '../storage/migrations';

export type IntakeDimension = 'time' | 'pull' | 'displacement';

export interface IntakeQuestion {
  id: string;
  channelKey: ChannelKey;
  dimension: IntakeDimension;
  /** How the answer is given: weekly hours, a 0–4 Likert, or a casualty pick. */
  type: 'hours' | 'likert' | 'casualties';
  text: string;
}

/** The five pull items, plainly worded (04 §1.2) — same for every channel. */
export const PULL_ITEMS = [
  'You reach for it without deciding to.',
  'You have tried to stop or cut down, and it did not hold.',
  'You keep going even though it costs you something you could name.',
  'You feel restless or irritable when you stop.',
  'You hide it, or say it is less than it is.',
] as const;

/** Casualty options for the displacement checklist (04 §1.3). */
export const CASUALTY_OPTIONS: { key: Casualty; label: string }[] = [
  { key: 'sleep', label: 'sleep' },
  { key: 'close_relationship', label: 'a close relationship' },
  { key: 'finances', label: 'money that mattered' },
  { key: 'skill_craft', label: 'a skill or craft' },
  { key: 'body_outdoors', label: 'your body, or the outdoors' },
  { key: 'meals_with_people', label: 'meals with people' },
];

const channelName = (key: ChannelKey): string =>
  CHANNELS.find((c) => c.key === key)!.name.toLowerCase();

function questionsFor(key: ChannelKey): IntakeQuestion[] {
  const name = channelName(key);
  return [
    {
      id: `q.${key}.time.1`,
      channelKey: key,
      dimension: 'time',
      type: 'hours',
      text: `In an honest week, how many hours go to ${name}?`,
    },
    ...PULL_ITEMS.map((item, i) => ({
      id: `q.${key}.pull.${i + 1}`,
      channelKey: key,
      dimension: 'pull' as const,
      type: 'likert' as const,
      text: `About ${name}: ${item.toLowerCase()}`,
    })),
    {
      id: `q.${key}.displacement.1`,
      channelKey: key,
      dimension: 'displacement',
      type: 'casualties',
      text: `What has ${name} been taking? Name what it touched.`,
    },
  ];
}

export const QUESTION_BANK: IntakeQuestion[] = CHANNEL_KEYS.flatMap(questionsFor);

export function questionById(id: string): IntakeQuestion | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

/* ----- Localized generation (NFR-X2) -------------------------------------
 * The bank is generated from a handful of templates, so a locale needs only
 * those templates and the channel names — twelve channels × seven questions
 * arrive translated for the price of a short list. IDs and scoring stay
 * locale-independent; only the DISPLAY text varies.
 */

export const CHANNEL_NAMES_SK: Record<ChannelKey, string> = {
  feeds: 'Feedy a krátke videá',
  series: 'Seriály a streamovanie',
  games: 'Hry a lootové mechaniky',
  betting: 'Stávky a špekulácie',
  porn: 'Pornografia a sex bez hraníc',
  substances: 'Návykové látky',
  nightlife: 'Nočný život a vyrábaná zábava',
  shopping: 'Nakupovanie a materializmus',
  outsourced_thinking: 'Outsourcované myslenie',
  abandoned_skills: 'Opustené zručnosti',
  spectator: 'Divácky život',
  relationships: 'Hladujúce vzťahy',
};

export const PULL_ITEMS_SK = [
  'Siahaš po tom bez rozhodnutia.',
  'Skúšal si prestať alebo obmedziť, a nevydržalo to.',
  'Pokračuješ, hoci ťa to stojí niečo, čo vieš pomenovať.',
  'Si nepokojný alebo podráždený, keď prestaneš.',
  'Skrývaš to, alebo hovoríš, že je to menej.',
] as const;

const CASUALTY_LABELS_SK: Record<Casualty, string> = {
  sleep: 'spánok',
  close_relationship: 'blízky vzťah',
  finances: 'peniaze, na ktorých záležalo',
  skill_craft: 'zručnosť alebo remeslo',
  body_outdoors: 'tvoje telo alebo pobyt vonku',
  meals_with_people: 'jedlá s ľuďmi',
};

const isSk = (locale: string) => locale.toLowerCase().startsWith('sk');

/** Channel name for display, per locale (canonical keys never change). */
export function channelDisplayName(key: ChannelKey, locale: string): string {
  if (isSk(locale)) return CHANNEL_NAMES_SK[key];
  return CHANNELS.find((c) => c.key === key)?.name ?? key;
}

/** Casualty option label, per locale. */
export function casualtyLabel(key: Casualty, locale: string): string {
  if (isSk(locale)) return CASUALTY_LABELS_SK[key];
  return CASUALTY_OPTIONS.find((o) => o.key === key)?.label ?? key;
}

/** The question's display text, regenerated per locale from the templates. */
export function questionText(question: IntakeQuestion, locale: string): string {
  if (!isSk(locale)) return question.text;
  const name = CHANNEL_NAMES_SK[question.channelKey].toLowerCase();
  if (question.dimension === 'time') {
    return `Koľko hodín ide v úprimnom týždni na: ${name}?`;
  }
  if (question.dimension === 'displacement') {
    return `Čo ti berie ${name}? Pomenuj, čoho sa to dotklo.`;
  }
  const index = Number(question.id.split('.').pop()) - 1;
  const item = PULL_ITEMS_SK[index] ?? PULL_ITEMS_SK[0];
  return `O kanáli ${name}: ${item.charAt(0).toLowerCase()}${item.slice(1)}`;
}
