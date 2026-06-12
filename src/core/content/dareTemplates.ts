/**
 * Dare ladder templates (PLAN-02): seven escalating real-world challenges per
 * channel, from a small honest step to a season-defining one. Editorial
 * content — ships in the fallback bundle, replaceable OTA. Custom dares come
 * later via the Companion; these are the starting rungs.
 */
import { ChannelKey } from '../scoring/config';

export const DARE_TEMPLATES: Record<ChannelKey, [string, string, string, string, string, string, string]> = {
  feeds: [
    'Eat one meal today with the phone in another room.',
    'Move the feed apps off your home screen, into one buried folder.',
    'Spend the first thirty minutes after waking without a screen.',
    'One full evening offline — tell someone in advance so it holds.',
    'Log out of every feed; let every visit cost a password.',
    'Delete one feed app for a full week, the one that takes most.',
    'A whole weekend day without feeds — plan it with someone you love.',
  ],
  series: [
    'Stop tonight at the end of one episode — stand up when the credits roll.',
    'Turn off autoplay everywhere it can be turned off.',
    'One evening this week with the TV dark, doing anything with your hands.',
    'Finish a season only on the weekend — weekday nights stay yours.',
    'Replace one episode with one chapter, in bed, on paper.',
    'A full week with no series — notice what the evenings become.',
    'Cancel one streaming service for a month and put the money somewhere visible.',
  ],
  games: [
    'Set a timer before you play; stop when it rings, mid-match if it must be.',
    'Uninstall one game that gives you nothing but the next pull.',
    'No purchases in any game for two weeks — wanting is allowed, buying is not.',
    'One whole evening of the game replaced by something you used to love.',
    'Tell a friend your weekly hours, out loud, in person.',
    'A week without the main game — keep the account, lose the habit.',
    'A month free of the one that holds you hardest. The ladder waits if you slip.',
  ],
  betting: [
    'Today, write down every urge to bet and what was happening just before.',
    'Remove every betting app; let the urge outlive the uninstall.',
    'Tell one person you trust how much last month actually cost.',
    'Block your cards at the betting sites your bank allows.',
    'A week with zero bets — move the stake money to someone who needs it.',
    'Visit gamblingtherapy or your local equivalent once, just to read.',
    'A full month clean, with a weekly check-in with the person from rung three.',
  ],
  porn: [
    'Tonight, keep the phone out of the bedroom entirely.',
    'Install a blocker — not as a cage, as a speed bump.',
    'Notice the cue once: write down when the pull comes, nothing more.',
    'A week with screens off after ten at night.',
    'Say it to one human being you trust — once, plainly.',
    'Two weeks clean; each urge becomes the craving button instead.',
    'A season goal written in your own words, kept where you pray or plan.',
  ],
  substances: [
    'One day fully clear, today, and a note on how the evening felt.',
    'Remove what lives in the house beyond today’s honest need.',
    'Tell one person what you are loosening — let them ask you about it.',
    'A clear weekend, planned ahead, with something good in the empty space.',
    'One week clear; the craving button instead of the first reach.',
    'Speak to a professional once — information, not commitment.',
    'A month, with help; mercy if you slip, and the ladder simply waits.',
  ],
  nightlife: [
    'Leave one night out an hour earlier than everyone — sleep is yours.',
    'One weekend night fully in: cook, host, or rest, by choice.',
    'Set a spending line for the night before you leave; keep it.',
    'Plan one daylight meeting with the friends you only ever see at night.',
    'Two weekends with one night out instead of two.',
    'Say one honest no to a night you don’t actually want.',
    'A month of nights that end before midnight; count what mornings become.',
  ],
  shopping: [
    'Tonight, empty every cart without buying — sleep on all of it.',
    'Unsubscribe from every store email in your inbox today.',
    'A week with nothing bought beyond food and needs.',
    'Return or give away one thing bought on impulse — feel the undoing.',
    'Delete saved cards from the shops; let buying take effort.',
    'A month of one wish list: write wants down, buy only what survives it.',
    'Put one month’s impulse total toward something with a face — a person, a cause.',
  ],
  outsourced_thinking: [
    'Answer one real question today from your own head; check after, not before.',
    'Write one paragraph — a message, a thought — with no assistant at all.',
    'A day of decisions made without asking the machine first.',
    'Do one piece of work end to end with your own reasoning; then compare.',
    'Memorize one thing worth keeping: a poem, a verse, a number.',
    'A week where the machine drafts nothing personal — only you speak as you.',
    'Teach someone something you know, from memory, face to face.',
  ],
  abandoned_skills: [
    'Touch the old skill for five minutes today — open the case, the file, the box.',
    'Clear one space for it: a desk corner, a shelf, an hour.',
    'Thirty unbroken minutes of practice, phone in another room.',
    'Show the rusty work to one kind person.',
    'A week with three short sessions — small, scheduled, kept.',
    'Finish one small piece, start to end, however rough.',
    'Give one finished thing away, or perform it once, for someone real.',
  ],
  spectator: [
    'Watch one game less this week; play anything yourself instead.',
    'Mute the commentary channels for a day — keep the silence.',
    'Replace one highlights hour with one walk, run, or kickabout.',
    'Go to one local, live, small thing instead of the big screen.',
    'A week without scores at work — the table will wait.',
    'Join one thing you can do badly in public — a class, a league, a choir.',
    'A month where you sweat more hours than you spectate.',
  ],
  relationships: [
    'Send one honest message today to someone who deserves better than your silence.',
    'One phone call this week to a person you keep meaning to call.',
    'A meal with someone, both phones face down and away.',
    'Ask one real question of someone close, and only listen.',
    'Visit someone — no occasion, no reason, just the door.',
    'Repair one small thing: the apology, the thank-you, the overdue word.',
    'Plan one standing time with someone you love, weekly, and keep it a month.',
  ],
};

export function dareLadderFor(channel: ChannelKey): string[] {
  return [...DARE_TEMPLATES[channel]];
}
