import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import { ensureProfile, getProfile } from '../../../core/storage/repos/profileRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { IntakeQuizFlow } from '../IntakeQuizFlow';
import { allResponses } from '../intakeRepo';

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
  return db;
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

async function mount(db: Awaited<ReturnType<typeof openDb>>) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<IntakeQuizFlow db={db} onExit={() => {}} />);
  });
  await ReactTestRenderer.act(async () => {});
  return tree;
}

describe('IntakeQuizFlow (ONB-04 quiz mode)', () => {
  it('starts the intake and marks it in progress', async () => {
    const db = await openDb();
    const tree = await mount(db);
    expect((await getProfile(db))!.onboardingState).toBe('intake_in_progress');
    expect(JSON.stringify(tree.toJSON())).toContain('how many hours');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('skip records the question and moves on', async () => {
    const db = await openDb();
    const tree = await mount(db);
    await press(tree, 'skip');
    const responses = await allResponses(db);
    expect(responses).toHaveLength(1);
    expect(responses[0].skipped).toBe(true);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('"enough for now" pauses into a kind terminal; nothing is lost', async () => {
    const db = await openDb();
    const tree = await mount(db);
    await press(tree, 'skip'); // one seen question to preserve
    await press(tree, 'enough for now');
    expect(JSON.stringify(tree.toJSON())).toContain('Nothing is lost.');
    expect((await getProfile(db))!.onboardingState).toBe('intake_in_progress'); // resumable
    expect(await allResponses(db)).toHaveLength(1);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('skipping everything still completes the intake — and the Mirror waits', async () => {
    const db = await openDb();
    const tree = await mount(db);
    // 12 screener skips deepen all channels; cap is 40 → 40 skips end it.
    for (let i = 0; i < 40; i++) {
      await press(tree, 'skip');
    }
    expect(JSON.stringify(tree.toJSON())).toContain('The Mirror has what it needs.');
    expect((await getProfile(db))!.onboardingState).toBe('intake_done');
    expect(await allResponses(db)).toHaveLength(40);
    await ReactTestRenderer.act(async () => tree.unmount());
  }, 120000);
});
