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
];

export function pathById(id: string): Path | undefined {
  return PATHS.find((p) => p.id === id);
}
