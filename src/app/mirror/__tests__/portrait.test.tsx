import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { MECHANISM_LINES } from '../../../core/content/mechanisms';
import { questionById } from '../../../core/content/questionBank';
import { CHANNEL_KEYS } from '../../../core/scoring/config';
import { Storage } from '../../../core/storage/Storage';
import { ensureProfile, setOnboardingState } from '../../../core/storage/repos/profileRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { activeThread } from '../../plan/threadRepo';
import { getProfile } from '../../../core/storage/repos/profileRepo';
import { saveAnswer } from '../intakeRepo';
import { describeAnswer, PortraitFlow } from '../PortraitFlow';
import { latestScores } from '../recalc';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  const db = await storage.open();
  await ensureProfile(db, new Date(2026, 5, 12, 9, 0));
  await setOnboardingState(db, 'intake_done');
  return db;
}

async function answerFeedsHot(db: Awaited<ReturnType<typeof openDb>>) {
  const now = new Date(2026, 5, 12, 9, 30);
  await saveAnswer(db, questionById('q.feeds.time.1')!, { kind: 'hours', hoursPerWeek: 20 }, now);
  for (let i = 1; i <= 5; i++) {
    await saveAnswer(db, questionById(`q.feeds.pull.${i}`)!, { kind: 'likert', value: 4 }, now);
  }
  await saveAnswer(
    db,
    questionById('q.feeds.displacement.1')!,
    { kind: 'casualties', casualties: ['sleep'] },
    now,
  );
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, labelPart: string) {
  const [target] = tree.root.findAll(
    (n) =>
      typeof n.props.accessibilityLabel === 'string' &&
      n.props.accessibilityLabel.includes(labelPart) &&
      typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable matching "${labelPart}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

async function mount(db: Awaited<ReturnType<typeof openDb>>) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<PortraitFlow db={db} onExit={() => {}} />);
  });
  await ReactTestRenderer.act(async () => {});
  return tree;
}

describe('mechanism copy (MIR-02)', () => {
  it('has one plain line per channel', () => {
    for (const key of CHANNEL_KEYS) {
      expect(MECHANISM_LINES[key].length).toBeGreaterThan(10);
      expect(MECHANISM_LINES[key]).not.toMatch(/!/); // no urgency (06 §Copy)
    }
  });
});

describe('PortraitFlow (MIR-01..03)', () => {
  it('first view runs the recalc itself — the Mirror is never empty', async () => {
    const db = await openDb();
    await answerFeedsHot(db);
    const tree = await mount(db);
    expect((await latestScores(db)).length).toBe(12);
    expect(JSON.stringify(tree.toJSON())).toContain('feeds');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('shows bands in words and points to the deepest capture', async () => {
    const db = await openDb();
    await answerFeedsHot(db);
    const tree = await mount(db);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('— caught'); // feeds, rendered as a word, never a chart
    expect(json).toContain('One thread holds most of the weight: feeds');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('one tap opens the channel’s own answers and raw numbers (MIR-01/03)', async () => {
    const db = await openDb();
    await answerFeedsHot(db);
    const tree = await mount(db);
    await press(tree, 'Feeds & shorts — caught');
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain(MECHANISM_LINES.feeds); // the mechanism, named plainly
    expect(json).toContain('20 hours'); // the person’s own answer
    expect(json).toContain('always'); // likert answers in their words
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('first viewing flows into first-thread selection (ONB-06, PLAN-01)', async () => {
    const db = await openDb(); // state: intake_done — this IS the first viewing
    await answerFeedsHot(db);
    const tree = await mount(db);
    await press(tree, 'i have seen it');

    // The deepest capture is the suggested first thread (MIR-02).
    expect(JSON.stringify(tree.toJSON())).toContain('begin with feeds & shorts');
    await press(tree, 'begin with feeds & shorts');

    const thread = await activeThread(db);
    expect(thread!.channelKey).toBe('feeds');
    expect((await getProfile(db))!.onboardingState).toBe('thread_chosen');
    expect(JSON.stringify(tree.toJSON())).toContain('That is enough for today. Go live.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('"not yet" leaves the thread unchosen and still releases (ONB-06)', async () => {
    const db = await openDb();
    await answerFeedsHot(db);
    const tree = await mount(db);
    await press(tree, 'i have seen it');
    await press(tree, 'not yet');
    expect(await activeThread(db)).toBeNull();
    expect(JSON.stringify(tree.toJSON())).toContain('That is enough for today. Go live.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('a later visit skips thread selection and ends in the map terminal', async () => {
    const db = await openDb();
    await setOnboardingState(db, 'portrait_seen'); // not the first viewing
    await answerFeedsHot(db);
    const tree = await mount(db);
    await press(tree, 'i have seen it');
    expect(JSON.stringify(tree.toJSON())).toContain('not a verdict, a map');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('re-measure on demand (MIR-05)', () => {
  it('"measure again" recalculates from today’s answers and evidence', async () => {
    const db = await openDb();
    await answerFeedsHot(db);
    const tree = await mount(db);
    expect(JSON.stringify(tree.toJSON())).toContain('— caught');

    // The person re-answers cooler, then asks the Mirror to look again.
    await saveAnswer(db, questionById('q.feeds.time.1')!, { kind: 'hours', hoursPerWeek: 2 }, new Date(2026, 5, 12, 10, 0));
    for (let i = 1; i <= 5; i++) {
      await saveAnswer(db, questionById(`q.feeds.pull.${i}`)!, { kind: 'likert', value: 0 }, new Date(2026, 5, 12, 10, 0));
    }
    await saveAnswer(db, questionById('q.feeds.displacement.1')!, { kind: 'casualties', casualties: [] }, new Date(2026, 5, 12, 10, 0));
    await press(tree, 'measure again');
    expect(JSON.stringify(tree.toJSON())).not.toContain('— caught');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('help-first gating (SAFE-03/04)', () => {
  async function answerSubstancesSevere(db: Awaited<ReturnType<typeof openDb>>) {
    const now = new Date(2026, 5, 12, 9, 30);
    for (let i = 1; i <= 5; i++) {
      await saveAnswer(db, questionById(`q.substances.pull.${i}`)!, { kind: 'likert', value: 4 }, now);
    }
  }

  it('severity patterns put the help screen before the Portrait', async () => {
    const db = await openDb();
    await answerSubstancesSevere(db);
    const tree = await mount(db);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('a real person, not a screen');
    expect(json).toContain('112'); // region resources (SAFE-02)
    expect(json).not.toContain('One thread holds'); // the Mirror waits its turn
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('the person continues when ready — never blocked (SAFE-02)', async () => {
    const db = await openDb();
    await answerSubstancesSevere(db);
    const tree = await mount(db);
    await press(tree, 'i have what i need — go on');
    const json = JSON.stringify(tree.toJSON());
    expect(json).not.toContain('a real person, not a screen'); // help stepped aside
    expect(json).toContain('i have seen it'); // the Portrait is now in front
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('an unremarkable intake sees no help screen', async () => {
    const db = await openDb();
    await answerFeedsHot(db); // feeds are loud, but not a severity channel
    const tree = await mount(db);
    expect(JSON.stringify(tree.toJSON())).not.toContain('a real person, not a screen');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('describeAnswer (MIR-03)', () => {
  it('renders each answer kind in the person’s own terms', () => {
    const base = {
      id: 'r1',
      createdAt: 'now',
      questionId: 'q.feeds.time.1',
      channelKey: 'feeds' as const,
      dimension: 'time' as const,
      normalized: 70,
      skipped: false,
    };
    expect(describeAnswer({ ...base, rawAnswer: { kind: 'hours', hoursPerWeek: 14 } })).toContain(
      '14 hours',
    );
    expect(
      describeAnswer({ ...base, rawAnswer: { kind: 'likert', value: 2 } }),
    ).toContain('sometimes');
    expect(
      describeAnswer({ ...base, rawAnswer: { kind: 'casualties', casualties: ['sleep'] } }),
    ).toContain('sleep');
    expect(describeAnswer({ ...base, rawAnswer: null, skipped: true })).toContain(
      'let this one pass',
    );
  });
});
