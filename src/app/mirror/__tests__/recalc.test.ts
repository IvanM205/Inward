import { questionById } from '../../../core/content/questionBank';
import { band, rawCapture, timeScore } from '../../../core/scoring/engine';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { addEntry } from '../../journal/journalRepo';
import { saveAnswer } from '../intakeRepo';
import { latestLevel, latestScores, weeklyRecalc, weekIndexOf } from '../recalc';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const WEEK0 = new Date(2026, 5, 12, 19, 0);
const WEEK1 = new Date(2026, 5, 19, 19, 0);

/** Answer feeds as clearly captured: 14 h/week, pull 3s, two casualties. */
async function answerFeedsHot(db: Awaited<ReturnType<typeof openDb>>, now: Date) {
  await saveAnswer(db, questionById('q.feeds.time.1')!, { kind: 'hours', hoursPerWeek: 14 }, now);
  for (let i = 1; i <= 5; i++) {
    await saveAnswer(db, questionById(`q.feeds.pull.${i}`)!, { kind: 'likert', value: 3 }, now);
  }
  await saveAnswer(
    db,
    questionById('q.feeds.displacement.1')!,
    { kind: 'casualties', casualties: ['sleep', 'close_relationship'] },
    now,
  );
}

describe('weeklyRecalc (04 §4, §7)', () => {
  it('persists one score per channel with engine math and explanation refs', async () => {
    const db = await openDb();
    await answerFeedsHot(db, WEEK0);
    await weeklyRecalc(db, WEEK0);

    const scores = await latestScores(db);
    expect(scores).toHaveLength(12);

    const feeds = scores.find((s) => s.channelKey === 'feeds')!;
    expect(feeds.timeScore).toBeCloseTo(timeScore('feeds', 14)); // 70
    expect(feeds.pullScore).toBeCloseTo(75); // five 3s of 4
    expect(feeds.displacementScore).toBeCloseTo(50); // sleep + close relationship
    expect(feeds.rawCapture).toBeCloseTo(rawCapture(70, 75, 50)); // 67
    expect(feeds.band).toBe(band(feeds.effectiveScore));
    expect(feeds.band).toBe('caught');
    expect(feeds.explanationRefs).toHaveLength(7); // MIR-03: the score explains itself

    // Unanswered channels rest at zero — absence of evidence is freedom.
    const series = scores.find((s) => s.channelKey === 'series')!;
    expect(series.effectiveScore).toBe(0);
    expect(series.band).toBe('free');
  });

  it('journal evidence lowers the effective score, capped at 10 (04 §2, §6)', async () => {
    const db = await openDb();
    await answerFeedsHot(db, WEEK0);
    // A counted care entry maps to feeds at full weight (04 §2.1).
    await addEntry(
      db,
      {
        type: 'care',
        text: 'deleted the feeds app from my phone',
        channelKeys: ['feeds'],
        origin: 'evening',
      },
      WEEK0,
    );
    await weeklyRecalc(db, WEEK0);
    const feeds = (await latestScores(db)).find((s) => s.channelKey === 'feeds')!;
    expect(feeds.evidenceOffset).toBeCloseTo(0.6);
    expect(feeds.effectiveScore).toBeCloseTo(feeds.rawCapture - 0.6);
    expect(feeds.evidenceOffset).toBeLessThanOrEqual(10);
  });

  it('the headline is the score-weighted mean — deepest captures dominate', async () => {
    const db = await openDb();
    await answerFeedsHot(db, WEEK0);
    const headline = await weeklyRecalc(db, WEEK0);
    const feeds = (await latestScores(db)).find((s) => s.channelKey === 'feeds')!;
    // Only feeds is non-zero, so the weighted mean IS feeds' effective score.
    expect(headline.level).toBeCloseTo(feeds.effectiveScore);
    expect((await latestLevel(db))!.level).toBeCloseTo(headline.level);
  });

  it('re-running the same week replaces rows; weeks accumulate as history', async () => {
    const db = await openDb();
    await answerFeedsHot(db, WEEK0);
    await weeklyRecalc(db, WEEK0);
    await weeklyRecalc(db, WEEK0); // on-demand re-measure, same week
    const week0Rows = await db.execute('SELECT COUNT(*) AS n FROM channel_score');
    expect(week0Rows.rows[0].n).toBe(12);

    await weeklyRecalc(db, WEEK1);
    const allRows = await db.execute('SELECT COUNT(*) AS n FROM channel_score');
    expect(allRows.rows[0].n).toBe(24); // history kept (03 §ChannelScore)
    expect(weekIndexOf(WEEK1)).toBe(weekIndexOf(WEEK0) + 1);
  });

  it('smoothing averages the trailing weeks (04 §2.3)', async () => {
    const db = await openDb();
    await answerFeedsHot(db, WEEK0);
    await weeklyRecalc(db, WEEK0);
    const week0 = (await latestScores(db)).find((s) => s.channelKey === 'feeds')!;

    // Week 1: the person re-answers cooler — 7 h and calmer pull.
    await saveAnswer(db, questionById('q.feeds.time.1')!, { kind: 'hours', hoursPerWeek: 7 }, WEEK1);
    for (let i = 1; i <= 5; i++) {
      await saveAnswer(db, questionById(`q.feeds.pull.${i}`)!, { kind: 'likert', value: 1 }, WEEK1);
    }
    await weeklyRecalc(db, WEEK1);
    const week1 = (await latestScores(db)).find((s) => s.channelKey === 'feeds')!;
    // Effective reflects the MEAN of both weeks' raw captures, not week 1 alone.
    expect(week1.effectiveScore).toBeCloseTo((week0.rawCapture + week1.rawCapture) / 2);
  });

  it('a silent life scores level 0, free', async () => {
    const db = await openDb();
    const headline = await weeklyRecalc(db, WEEK0);
    expect(headline.level).toBe(0);
    expect(headline.band).toBe('free');
  });
});
