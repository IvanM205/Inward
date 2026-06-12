import { QUESTION_BANK, questionById } from '../../../core/content/questionBank';
import { CHANNEL_KEYS } from '../../../core/scoring/config';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { DEEPEN_THRESHOLD, nextQuestion, QUESTION_CAP } from '../adaptive';
import { allResponses, saveAnswer, seenQuestionIds, skipQuestion } from '../intakeRepo';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const NOW = new Date(2026, 5, 12, 10, 0);

/** Drive a whole intake through the adaptive cursor, answering by rule. */
async function runIntake(
  db: Awaited<ReturnType<typeof openDb>>,
  answerHours: (channel: string) => number | 'skip',
): Promise<string[]> {
  const asked: string[] = [];
  for (;;) {
    const q = nextQuestion(await seenQuestionIds(db), await allResponses(db));
    if (q === null) return asked;
    asked.push(q.id);
    if (q.dimension === 'time') {
      const hours = answerHours(q.channelKey);
      if (hours === 'skip') await skipQuestion(db, q, NOW);
      else await saveAnswer(db, q, { kind: 'hours', hoursPerWeek: hours }, NOW);
    } else if (q.type === 'likert') {
      await saveAnswer(db, q, { kind: 'likert', value: 2 }, NOW);
    } else {
      await saveAnswer(db, q, { kind: 'casualties', casualties: ['sleep'] }, NOW);
    }
  }
}

describe('adaptive intake (ONB-04)', () => {
  it('screens all twelve channels first', () => {
    const first = nextQuestion(new Set(), []);
    expect(first!.dimension).toBe('time');
    expect(QUESTION_BANK.filter((q) => q.dimension === 'time')).toHaveLength(
      CHANNEL_KEYS.length,
    );
  });

  it('a quiet life ends after the twelve screeners — short and merciful', async () => {
    const db = await openDb();
    const asked = await runIntake(db, () => 0); // nothing captures anyone
    expect(asked).toHaveLength(12);
  });

  it('deepens only the channels that screened hot', async () => {
    const db = await openDb();
    // feeds at 14 h/week normalizes to 70 (≥ threshold); everything else cold.
    const asked = await runIntake(db, (channel) => (channel === 'feeds' ? 14 : 0));
    expect(asked).toHaveLength(12 + 6); // screeners + feeds' 5 pull + displacement
    expect(asked).toContain('q.feeds.pull.1');
    expect(asked).toContain('q.feeds.displacement.1');
    expect(asked).not.toContain('q.series.pull.1');
  });

  it('a skipped screener still deepens — refusing to answer is not a verdict', async () => {
    const db = await openDb();
    const asked = await runIntake(db, (channel) => (channel === 'porn' ? 'skip' : 0));
    expect(asked).toContain('q.porn.pull.1');
  });

  it('never exceeds the question cap (~15 minutes, ONB-04)', async () => {
    const db = await openDb();
    const asked = await runIntake(db, () => 25); // everything screams hot
    expect(asked.length).toBeLessThanOrEqual(QUESTION_CAP);
    expect(asked.length).toBe(QUESTION_CAP);
  });

  it('nothing is ever re-asked within one intake', async () => {
    const db = await openDb();
    const asked = await runIntake(db, () => 25);
    expect(new Set(asked).size).toBe(asked.length);
  });

  it('the threshold is the configured one', () => {
    const screener = questionById('q.feeds.time.1')!;
    expect(screener).toBeDefined();
    expect(DEEPEN_THRESHOLD).toBe(40);
  });
});
