/**
 * Paths (LIB-02, 02 §Content): 7–14 day journeys — each day one reading, one
 * question, one real-world act. The fallback bundle ships one seven-day path
 * built over the reading bank; editorial bundles add more OTA. One active
 * Path at most, no recommendations, completion ends in the world.
 */

export interface PathDay {
  readingId: string;
  question: string;
  act: string;
}

export interface Path {
  id: string;
  title: string;
  days: PathDay[];
}

export const PATHS: Path[] = [
  {
    id: 'path.returning',
    title: 'The Returning — seven days back toward your own life',
    days: [
      {
        readingId: 'reading.shortness',
        question: 'Where did yesterday actually go?',
        act: 'Tonight, write the day’s hours down once, plainly, for no one but you.',
      },
      {
        readingId: 'reading.morning',
        question: 'What deserves your first hour?',
        act: 'Tomorrow, keep the first thirty minutes after waking for it — screen elsewhere.',
      },
      {
        readingId: 'reading.deliberately',
        question: 'Which hour of today will you choose on purpose?',
        act: 'Put both hands on one hour today: one task, one place, nothing else.',
      },
      {
        readingId: 'reading.ours',
        question: 'Whose applause have you been working for?',
        act: 'Do one good thing today and tell no one at all.',
      },
      {
        readingId: 'reading.neighbor',
        question: 'Who is nearest to you, and what small thing do they need?',
        act: 'Do that small thing before the day ends — a call, a hand, a repair.',
      },
      {
        readingId: 'reading.hands',
        question: 'What did your hands once know?',
        act: 'Touch that skill for ten minutes today, badly and gladly.',
      },
      {
        readingId: 'reading.patience',
        question: 'Which question in your life deserves a season, not a search?',
        act: 'Write that question on paper and put it where you will see it for a month.',
      },
    ],
  },
  {
    id: 'path.empty-minute',
    title: 'The Empty Minute — seven days of unhurried time',
    days: [
      {
        readingId: 'reading.gift-of-boredom',
        question: 'Which waits in your day do you reflexively board up?',
        act: 'Stand in three waits today — kettle, queue, light — with empty hands.',
      },
      {
        readingId: 'reading.leisure',
        question: 'What would real rest look like tonight, if no one could see it?',
        act: 'One evening hour of true leisure: present somewhere, producing nothing.',
      },
      {
        readingId: 'reading.walking',
        question: 'What has been circling your mind that never lands?',
        act: 'Give it a thirty-minute walk, phone at home or silenced in a pocket.',
      },
      {
        readingId: 'reading.attention-love',
        question: 'Who gets your leftover attention that deserves the first of it?',
        act: 'Ten undivided minutes with that person today — nothing else in hand.',
      },
      {
        readingId: 'reading.morning',
        question: 'What did the first hour of today actually serve?',
        act: 'Tomorrow, point the first thirty minutes before any screen points you.',
      },
      {
        readingId: 'reading.enough',
        question: 'If this afternoon were singular — which it is — what would it hold?',
        act: 'Defend one afternoon hour for the thing you keep postponing.',
      },
      {
        readingId: 'reading.shortness',
        question: 'After a week of empty minutes — where does your time actually want to go?',
        act: 'Write one sentence of intent for next week and leave it on paper, not in the phone.',
      },
    ],
  },
];

export function pathById(id: string): Path | undefined {
  return PATHS.find((p) => p.id === id);
}
