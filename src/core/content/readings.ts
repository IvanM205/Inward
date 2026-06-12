/**
 * One Deep Thing — the fallback readings (LIB-01, 02 §Content pipeline).
 * Short pieces, two to four minutes, written in the product's voice after
 * thinkers in the public domain; cross-traditional and dogma-free (ADR-001:
 * universal, for all people with good heart). Editorial bundles replace and
 * extend these OTA. No recommendations exist anywhere — only today's piece.
 */

export interface Reading {
  id: string;
  title: string;
  author: string;
  body: string[];
  closingQuestion: string;
}

export const READINGS: Reading[] = [
  {
    id: 'reading.shortness',
    title: 'On the shortness of attention',
    author: 'after Seneca',
    body: [
      'It is not that we have a short life, the old philosopher wrote, but that we waste much of it. He had never seen a feed, and still he saw the problem whole: life is long enough, if you know where it goes.',
      'You would never hand a stranger your wallet. Yet whole evenings are handed to strangers, men you will never meet, who have arranged ten thousand small wonders end to end so that no end ever comes.',
      'The merchant of hours does not steal. You give. That is the whole trick, and the whole way out: what is given can stop being given.',
      'Count, tonight, only one thing — where the day actually went. Not to judge it. Only to know, the way a farmer knows his field.',
    ],
    closingQuestion: 'If this evening were given back to you whole, who would receive it?',
  },
  {
    id: 'reading.morning',
    title: 'The first hour',
    author: 'after Marcus Aurelius',
    body: [
      'The emperor wrote notes to himself at dawn: today I will meet the impatient, the ungrateful, the loud. He listed the day’s difficulties before the day could surprise him with them.',
      'We have inverted his habit. We hand the first hour to whatever is loudest in the palm of a hand — and call the noise news, and call the habit waking up.',
      'The first hour is a rudder. A small turn there moves the entire day, the way one degree at the harbor is a hundred miles at sea.',
      'He did not ask himself to be perfect at noon. Only to point the morning. The rest of the day, he knew, would follow the pointing.',
    ],
    closingQuestion: 'What would deserve your first hour tomorrow?',
  },
  {
    id: 'reading.deliberately',
    title: 'To live deliberately',
    author: 'after Thoreau',
    body: [
      'He went to the woods, he said, to live deliberately — to front only the essential facts of life, and not, when he came to die, discover that he had not lived.',
      'The woods are not the point. The word deliberately is the point. It means: chosen, on purpose, with the whole of you consenting.',
      'Most of what fills a day was never chosen. It seeped in, the way water finds a basement — through the crack of one idle minute, then another, until the floor is gone.',
      'You do not need a cabin. You need one hour with both hands on it. Deliberateness is not a place; it is a grip.',
    ],
    closingQuestion: 'Which hour of today did you actually choose?',
  },
  {
    id: 'reading.patience',
    title: 'The slow answers',
    author: 'after Rilke',
    body: [
      'Be patient, the poet told the young man, toward all that is unsolved in your heart. Try to love the questions themselves, like locked rooms, like books written in a foreign tongue.',
      'Every screen now promises the opposite: no question need stay open longer than a search. And so the muscle that can hold an open question — the patience that becomes depth — goes soft.',
      'But the questions that matter do not have lookup tables. Who to love. What to make. What to do with a short life. These are answered slowly, lived into, the way a tree answers the sun.',
      'Live the questions now, he said. Perhaps you will then, gradually, without noticing it, live along some distant day into the answer.',
    ],
    closingQuestion: 'Which question are you rushing that deserves a season instead?',
  },
  {
    id: 'reading.ours',
    title: 'What is ours',
    author: 'after Epictetus',
    body: [
      'The freed slave who became a teacher began every lesson the same way: some things are up to us, and some are not. Our opinions, our aims, our attention — ours. The applause of others — not ours.',
      'A like is applause from a stranger, weightless and engineered. To hang a morning’s mood on it is to hand the keys of the house to passers-by.',
      'He would not have asked you to feel nothing. Only to notice where the lever truly is: not in the count, but in the choosing of what you watch, what you practice, what you return to.',
      'Tend what is yours. The rest was never lost, because it was never had.',
    ],
    closingQuestion: 'What did you tend today that is actually yours?',
  },
  {
    id: 'reading.neighbor',
    title: 'The nearest life',
    author: 'after George Eliot',
    body: [
      'The growing good of the world, she wrote at the end of her greatest book, is partly dependent on unhistoric acts — on the people who live faithfully a hidden life, and rest in unvisited tombs.',
      'No feed will ever show you the unhistoric acts. They do not scale. A meal carried up a stair, a child heard out, a fence mended — these reach two people, or one, and change everything for them.',
      'The screen offers the whole world and asks for your neighbor in exchange. It is a bad trade, dressed as a window.',
      'The nearest life is the one entrusted to you. Its smallness is not a flaw; it is the address.',
    ],
    closingQuestion: 'Who is nearest to you tonight, and what small thing do they need?',
  },
  {
    id: 'reading.hands',
    title: 'What the hands know',
    author: 'after Montaigne',
    body: [
      'The essayist kept a tower full of books, and still insisted the body must have its share: he rode, he walked, he handled his orchard. Thinking, he said, that is done only in a chair forgets half of what it knows.',
      'There is a knowledge that lives in the hands — in bread dough, in a plane on wood, in a needle, in soil. It cannot be streamed, because it is not information. It is acquaintance.',
      'When the hands go idle for a season, that knowledge does not protest. It just quietly leaves, like a guest no one spoke to.',
      'Make one small thing this week, badly. The hands will not judge you. They have only been waiting to be asked.',
    ],
    closingQuestion: 'What did your hands once know that they would still remember?',
  },
  {
    id: 'reading.leisure',
    title: 'Real leisure',
    author: 'after Josef Pieper',
    body: [
      'A philosopher once argued that leisure is not the absence of work, and certainly not entertainment. It is a posture of the soul: receptive, unhurried, capable of festivity. A culture that loses it, he said, can only oscillate between toil and distraction.',
      'Look at an ordinary evening and the diagnosis holds. The hours after work are not rest; they are a second shift in the attention fields, harder to leave than the office.',
      'Real leisure does almost nothing, and is the opposite of doing nothing. Sitting with coffee while the light changes. A slow meal. Music listened to, not played underneath something else.',
      'The feed cannot give this, because the feed cannot be still. Stillness is the one content it has no format for.',
      'Tonight, when the urge to fill the evening comes, try the older thing instead: be somewhere, fully, without product.',
    ],
    closingQuestion: 'When were you last at rest without being entertained?',
  },
  {
    id: 'reading.attention-love',
    title: 'Attention is the rarest gift',
    author: 'after Simone Weil',
    body: [
      'A young teacher in hard times wrote that attention is the rarest and purest form of generosity. She meant the whole of it: to attend to someone is to give them, for a moment, everything you have.',
      'She would not have been surprised that an economy eventually formed to harvest it. What is most precious gets taken first.',
      'Notice what her sentence implies about the people you love. To be half with them — eyes returning to the glass rectangle — is not partial generosity. Attention does not divide; it only leaves.',
      'And notice the mercy in it too: you do not need money, talent, or strength to give the rarest gift. You need only to stay.',
      'One person today deserves the whole of you for ten minutes. You already know who.',
    ],
    closingQuestion: 'Who received your undivided attention today — and who deserved it?',
  },
  {
    id: 'reading.walking',
    title: 'The pace of thought',
    author: 'after Søren Kierkegaard',
    body: [
      'A restless thinker who walked his city daily claimed he had walked himself into his best thoughts, and away from every sickness he knew.',
      'There is a pace at which the mind digests a life, and it is very near three kilometers an hour. Faster, and the world smears. Stationary — scrolling — and the mind chews without swallowing, the same worry around and around.',
      'No one has ever scrolled themselves into clarity. Many have walked there.',
      'The walk asks nothing: no gear, no goal, no route. Out the door, turn left or right, return when something has settled.',
      'If a question is sitting on your chest tonight, take it outside. Let the feet have it for half an hour.',
    ],
    closingQuestion: 'What question of yours has been waiting for a walk?',
  },
  {
    id: 'reading.enough',
    title: 'The day you have',
    author: 'after Marcus Aurelius, again',
    body: [
      'The emperor reminded himself, on waking, that he could leave life right now — and that this thought should change breakfast, not darken it.',
      'The screen-merchants sell the opposite arithmetic: there will always be more — more episodes, more updates, more later. Infinity is their warehouse, and against infinity no single morning seems to matter.',
      'But you do not live in their warehouse. You live in a day. One. This one. Its hours are countable and the count is not large.',
      'This is not morbid. It is the only math that makes an afternoon precious enough to defend.',
      'Held against one real, finite, never-again day — what could an infinite feed possibly weigh?',
    ],
    closingQuestion: 'If today were known to be singular — which it is — what would its afternoon hold?',
  },
  {
    id: 'reading.gift-of-boredom',
    title: 'In defense of the empty minute',
    author: 'after Blaise Pascal',
    body: [
      'All of humanity’s problems, wrote a mathematician three centuries before the smartphone, stem from our inability to sit quietly in a room alone.',
      'He understood the mechanism precisely: we flee the empty minute because in it, the big questions stir. So we invent diversions — he listed hunting, gaming, court gossip; the list has since been digitized.',
      'The empty minute is not a malfunction. It is a door. Every idea you have ever been proud of walked through it. Every honest reckoning began there.',
      'An industry now exists to board up that door, minute by minute, with something almost interesting.',
      'Today, when a wait arrives — a queue, a kettle, a red light — do not reach. Stand in the open door a moment and see what comes through.',
    ],
    closingQuestion: 'What might be waiting in the minutes you keep boarding up?',
  },
];

export function readingById(id: string): Reading | undefined {
  return READINGS.find((r) => r.id === id);
}
