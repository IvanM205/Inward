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

export function mechanismLine(channel: ChannelKey): string {
  return MECHANISM_LINES[channel];
}
