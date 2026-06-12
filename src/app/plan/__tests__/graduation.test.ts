import { questionById } from '../../../core/content/questionBank';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { addEntry } from '../../journal/journalRepo';
import { saveAnswer } from '../../mirror/intakeRepo';
import { weeklyRecalc, weekIndexOf } from '../../mirror/recalc';
import {
  activeThread,
  advanceSeasonWeek,
  GRADUATION_WEEKS,
  markGraduationCelebrated,
  pendingGraduation,
  startThread,
} from '../threadRepo';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const WEEK0 = new Date(2026, 5, 7, 19, 0);
const weekAfter = (n: number) => new Date(2026, 5, 7 + 7 * n, 19, 0);

async function liveTheWeek(db: Awaited<ReturnType<typeof openDb>>, when: Date) {
  await addEntry(
    db,
    {
      type: 'care',
      text: `walked the long way home past the river on ${when.getDate()}`,
      channelKeys: ['feeds'],
      origin: 'evening',
    },
    when,
  );
}

describe('advanceSeasonWeek (PLAN-04)', () => {
  it('a held week advances; an empty week resets nothing', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', WEEK0);
    await advanceSeasonWeek(db, 100, true);
    expect((await activeThread(db))!.weeksHeld).toBe(1);
    await advanceSeasonWeek(db, 101, false); // relapse week
    expect((await activeThread(db))!.weeksHeld).toBe(1); // waits, never resets
    await advanceSeasonWeek(db, 102, true);
    expect((await activeThread(db))!.weeksHeld).toBe(2);
  });

  it('is idempotent within one week — re-running settles nothing twice', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', WEEK0);
    await advanceSeasonWeek(db, 100, true);
    await advanceSeasonWeek(db, 100, true);
    expect((await activeThread(db))!.weeksHeld).toBe(1);
  });

  it('graduates at four held weeks, celebrated exactly once', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', WEEK0);
    for (let week = 0; week < GRADUATION_WEEKS; week++) {
      await advanceSeasonWeek(db, 100 + week, true);
    }
    expect(await activeThread(db)).toBeNull(); // the season ended
    const graduated = await pendingGraduation(db);
    expect(graduated).not.toBeNull();
    expect(graduated!.weeksHeld).toBe(GRADUATION_WEEKS);

    await markGraduationCelebrated(db, graduated!.id);
    expect(await pendingGraduation(db)).toBeNull(); // one sentence, once
  });
});

describe('weeklyRecalc drives the season (04 §4 + PLAN-04)', () => {
  it('counts a week as held when lived evidence reached the thread channel', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', WEEK0);
    // Some intake so the recalc has anything to chew on (not required, but real).
    await saveAnswer(db, questionById('q.feeds.time.1')!, { kind: 'hours', hoursPerWeek: 10 }, WEEK0);

    await liveTheWeek(db, WEEK0);
    await weeklyRecalc(db, WEEK0);
    expect((await activeThread(db))!.weeksHeld).toBe(1);

    // A silent week: the recalc runs, the count waits.
    await weeklyRecalc(db, weekAfter(1));
    expect((await activeThread(db))!.weeksHeld).toBe(1);

    // Re-running the same week never double-counts.
    await liveTheWeek(db, weekAfter(2));
    await weeklyRecalc(db, weekAfter(2));
    await weeklyRecalc(db, weekAfter(2));
    expect((await activeThread(db))!.weeksHeld).toBe(2);
    expect(weekIndexOf(weekAfter(2))).toBe(weekIndexOf(WEEK0) + 2);
  });
});
