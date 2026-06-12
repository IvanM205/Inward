import {
  CASUALTY_OPTIONS,
  PULL_ITEMS,
  QUESTION_BANK,
  questionById,
} from '../../../core/content/questionBank';
import { CHANNEL_KEYS } from '../../../core/scoring/config';
import { timeScore } from '../../../core/scoring/engine';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import {
  allResponses,
  answeredFor,
  saveAnswer,
  seenQuestionIds,
  skipQuestion,
} from '../intakeRepo';

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
const FEEDS_TIME = questionById('q.feeds.time.1')!;
const FEEDS_PULL_2 = questionById('q.feeds.pull.2')!;
const FEEDS_DISPLACEMENT = questionById('q.feeds.displacement.1')!;

describe('question bank (ONB-04, 04 §1)', () => {
  it('covers every channel with 1 time + 5 pull + 1 displacement', () => {
    expect(QUESTION_BANK).toHaveLength(CHANNEL_KEYS.length * 7);
    for (const key of CHANNEL_KEYS) {
      const forChannel = QUESTION_BANK.filter((q) => q.channelKey === key);
      expect(forChannel.filter((q) => q.dimension === 'time')).toHaveLength(1);
      expect(forChannel.filter((q) => q.dimension === 'pull')).toHaveLength(PULL_ITEMS.length);
      expect(forChannel.filter((q) => q.dimension === 'displacement')).toHaveLength(1);
    }
  });

  it('has unique ids and the six casualty options', () => {
    expect(new Set(QUESTION_BANK.map((q) => q.id)).size).toBe(QUESTION_BANK.length);
    expect(CASUALTY_OPTIONS).toHaveLength(6);
  });
});

describe('intakeRepo (ONB-04, 03 §IntakeResponse)', () => {
  it('normalizes weekly hours through the scoring engine', async () => {
    const db = await openDb();
    const saved = await saveAnswer(db, FEEDS_TIME, { kind: 'hours', hoursPerWeek: 14 }, NOW);
    expect(saved.normalized).toBeCloseTo(timeScore('feeds', 14)); // 70 by config
    expect(saved.skipped).toBe(false);
  });

  it('normalizes a Likert item to 0–100 and rejects out-of-range values', async () => {
    const db = await openDb();
    const saved = await saveAnswer(db, FEEDS_PULL_2, { kind: 'likert', value: 3 }, NOW);
    expect(saved.normalized).toBe(75);
    await expect(
      saveAnswer(db, FEEDS_PULL_2, { kind: 'likert', value: 5 }, NOW),
    ).rejects.toThrow(/out of range/);
  });

  it('normalizes casualties through displacementScore', async () => {
    const db = await openDb();
    const saved = await saveAnswer(
      db,
      FEEDS_DISPLACEMENT,
      { kind: 'casualties', casualties: ['sleep', 'close_relationship'] },
      NOW,
    );
    expect(saved.normalized).toBe(50); // 25 + 25 per 04 §1.3
  });

  it('refuses an answer of the wrong shape for the question', async () => {
    const db = await openDb();
    await expect(saveAnswer(db, FEEDS_TIME, { kind: 'likert', value: 2 }, NOW)).rejects.toThrow(
      /expects a hours answer/,
    );
  });

  it('every question is skippable, and the skip is excluded from scoring input', async () => {
    const db = await openDb();
    await skipQuestion(db, FEEDS_PULL_2, NOW);
    expect(await answeredFor(db, 'feeds')).toHaveLength(0);
    expect((await allResponses(db))[0].skipped).toBe(true);
  });

  it('re-answering replaces the earlier row — also after a skip', async () => {
    const db = await openDb();
    await skipQuestion(db, FEEDS_PULL_2, NOW);
    await saveAnswer(db, FEEDS_PULL_2, { kind: 'likert', value: 4 }, NOW);
    const responses = await allResponses(db);
    expect(responses).toHaveLength(1);
    expect(responses[0].normalized).toBe(100);
    expect(responses[0].skipped).toBe(false);
  });

  it('seenQuestionIds is the resume cursor (pausable/resumable, ONB-04)', async () => {
    const db = await openDb();
    await saveAnswer(db, FEEDS_TIME, { kind: 'hours', hoursPerWeek: 7 }, NOW);
    await skipQuestion(db, FEEDS_PULL_2, NOW);
    const seen = await seenQuestionIds(db);
    expect(seen.has('q.feeds.time.1')).toBe(true);
    expect(seen.has('q.feeds.pull.2')).toBe(true);
    expect(seen.has('q.feeds.pull.3')).toBe(false);
  });
});

describe('localized generation (NFR-X2)', () => {
  const { casualtyLabel, channelDisplayName, questionText } = require('../../../core/content/questionBank');

  it('regenerates all 84 questions in Slovak from the templates', () => {
    for (const q of QUESTION_BANK) {
      const sk = questionText(q, 'sk');
      expect(sk.length).toBeGreaterThan(10);
      expect(sk).not.toBe(q.text); // actually translated
      expect(sk).not.toMatch(/!/); // copy voice holds in every locale
    }
    expect(questionText(questionById('q.feeds.time.1')!, 'sk')).toContain('Koľko hodín');
    expect(questionText(questionById('q.feeds.pull.2')!, 'sk')).toContain('nevydržalo');
    expect(questionText(questionById('q.feeds.displacement.1')!, 'sk')).toContain('Čo ti berie');
  });

  it('English stays the canonical text', () => {
    const q = questionById('q.feeds.time.1')!;
    expect(questionText(q, 'en')).toBe(q.text);
  });

  it('channel and casualty names localize, keys never do', () => {
    expect(channelDisplayName('feeds', 'sk')).toBe('Feedy a krátke videá');
    expect(channelDisplayName('feeds', 'en')).toBe('Feeds & shorts');
    expect(casualtyLabel('sleep', 'sk')).toBe('spánok');
    expect(casualtyLabel('sleep', 'en')).toBe('sleep');
  });
});
