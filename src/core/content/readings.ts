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
];

export function readingById(id: string): Reading | undefined {
  return READINGS.find((r) => r.id === id);
}
