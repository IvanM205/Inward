/**
 * Mechanism copy (MIR-02): one line per captured channel, naming plainly how
 * the system farms the person — no shame about the person, clear words about
 * the machine (06 §Copy voice: "the system is named plainly"). Keyed by the
 * channel table's mechanism_copy_id.
 */
import { ChannelKey } from '../scoring/config';

export const MECHANISM_LINES: Record<ChannelKey, string> = {
  feeds: 'Feeds are built to never end. Your attention is the harvest.',
  series: 'The next episode starts itself. Your evenings are the inventory.',
  games: 'The next win is timed to keep you pulling. Time is the price of the chase.',
  betting: 'The near-miss is engineered. Hope is what the house actually sells.',
  porn: 'Endless novelty rents the part of you meant for one real person.',
  substances: 'The relief is borrowed from tomorrow, with interest.',
  nightlife: 'The fun is engineered to peak where the spending does.',
  shopping: 'The wanting is manufactured before the thing is. Carts are designed to ache.',
  outsourced_thinking: 'Every question you hand over is a muscle you stop using.',
  abandoned_skills: 'What your hands once made now arrives made — and something in you idles.',
  spectator: 'Other people live in the arena; the seats are sold to your hours.',
  relationships: 'The people closest to you receive what the screen leaves over.',
};

export const MECHANISM_LINES_SK: Record<ChannelKey, string> = {
  feeds: 'Feedy sú postavené tak, aby sa nikdy neskončili. Tvoja pozornosť je úroda.',
  series: 'Ďalšia epizóda sa spúšťa sama. Tvoje večery sú tovar na sklade.',
  games: 'Ďalšia výhra je načasovaná tak, aby si ťahal ďalej. Cenou za naháňačku je čas.',
  betting: 'Tesná prehra je naprojektovaná. Dom v skutočnosti predáva nádej.',
  porn: 'Nekonečná novosť si prenajíma časť teba určenú pre jedného skutočného človeka.',
  substances: 'Úľava je požičaná od zajtrajška, aj s úrokmi.',
  nightlife: 'Zábava je vyrobená tak, aby vrcholila tam, kde míňanie.',
  shopping: 'Chcenie sa vyrába skôr než vec. Košíky sú navrhnuté tak, aby boleli.',
  outsourced_thinking: 'Každá otázka, ktorú odovzdáš, je sval, ktorý prestaneš používať.',
  abandoned_skills:
    'Čo kedysi robili tvoje ruky, teraz prichádza hotové — a niečo v tebe beží naprázdno.',
  spectator: 'Iní žijú v aréne; sedadlá sa predávajú za tvoje hodiny.',
  relationships: 'Najbližší ľudia dostávajú to, čo obrazovka nechá tak.',
};

export function mechanismLine(channel: ChannelKey, locale = 'en'): string {
  if (locale.toLowerCase().startsWith('sk')) return MECHANISM_LINES_SK[channel];
  return MECHANISM_LINES[channel];
}
