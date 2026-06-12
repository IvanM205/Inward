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
