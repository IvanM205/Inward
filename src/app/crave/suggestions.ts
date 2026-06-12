/**
 * CRAVE-02 — the suggested real-world action: rule-based on the named hunger
 * and the time of day, never algorithmic, never content. One concrete thing,
 * doable now, pointing out of the phone.
 */

export type Hunger = 'connection' | 'rest' | 'meaning' | 'body' | 'unsure';

export const HUNGERS: { key: Hunger; label: string }[] = [
  { key: 'connection', label: 'someone — connection' },
  { key: 'rest', label: 'rest' },
  { key: 'meaning', label: 'something that matters' },
  { key: 'body', label: 'my body wants something' },
  { key: 'unsure', label: 'i honestly don’t know' },
];

/** Night is wind-down territory: suggestions must not start the day over. */
const NIGHT_FROM = 21;
const NIGHT_TO = 6;

const ACTIONS: Record<Hunger, { day: string; night: string }> = {
  connection: {
    day: 'Call someone who would be glad to hear your voice. Not a text — a call.',
    night: 'Write one sentence to someone you miss. Send it in the morning.',
  },
  rest: {
    day: 'Ten minutes flat on your back, eyes closed, phone in another room.',
    night: 'Begin the wind-down now. The feed was never rest.',
  },
  meaning: {
    day: 'Do one small thing with your hands, start to finish.',
    night: 'Read one page of something old and slow, on paper if you can.',
  },
  body: {
    day: 'Go outside. Around the block counts.',
    night: 'Stretch slowly for two minutes, then a glass of water.',
  },
  unsure: {
    day: 'Stand at a window and name five things you can see. Then decide.',
    night: 'A glass of water, one more slow breath. Decide after.',
  },
};

const ACTIONS_SK: Record<Hunger, { day: string; night: string }> = {
  connection: {
    day: 'Zavolaj niekomu, koho poteší tvoj hlas. Nie správu — zavolaj.',
    night: 'Napíš jednu vetu niekomu, kto ti chýba. Pošli ju ráno.',
  },
  rest: {
    day: 'Desať minút naležato, oči zatvorené, telefón v inej izbe.',
    night: 'Začni stíšenie hneď. Feed nikdy nebol odpočinok.',
  },
  meaning: {
    day: 'Urob jednu malú vec rukami, od začiatku do konca.',
    night: 'Prečítaj jednu stranu niečoho starého a pomalého, ak sa dá, na papieri.',
  },
  body: {
    day: 'Choď von. Stačí okolo bloku.',
    night: 'Pomaly sa dve minúty ponaťahuj a daj si pohár vody.',
  },
  unsure: {
    day: 'Postav sa k oknu a pomenuj päť vecí, ktoré vidíš. Potom sa rozhodni.',
    night: 'Pohár vody, ešte jeden pomalý nádych. Rozhodni sa potom.',
  },
};

export function suggestAction(hunger: Hunger, now: Date, locale = 'en'): string {
  const hour = now.getHours();
  const night = hour >= NIGHT_FROM || hour < NIGHT_TO;
  const table = locale.toLowerCase().startsWith('sk') ? ACTIONS_SK : ACTIONS;
  return table[hunger][night ? 'night' : 'day'];
}
