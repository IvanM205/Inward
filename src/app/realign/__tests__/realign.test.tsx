import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { RealignFlow } from '../RealignFlow';
import { realignmentDue, realignmentForWeek, saveRealignment, weekStartOf } from '../realignRepo';

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
  return storage.open();
}

const FRIDAY = new Date(2026, 5, 12, 19, 0);

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

function typeInto(tree: ReactTestRenderer.ReactTestRenderer, label: string, text: string) {
  const input = tree.root.find(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onChangeText === 'function',
  );
  ReactTestRenderer.act(() => input.props.onChangeText(text));
}

describe('realignRepo (RLG-01)', () => {
  it('keys the week by its Monday', () => {
    expect(weekStartOf(FRIDAY)).toBe('2026-06-08');
    expect(weekStartOf(new Date(2026, 5, 8))).toBe('2026-06-08'); // Monday itself
    expect(weekStartOf(new Date(2026, 5, 14))).toBe('2026-06-08'); // Sunday still this week
  });

  it('is due until written, once per week', async () => {
    const db = await openDb();
    expect(await realignmentDue(db, FRIDAY)).toBe(true);
    await saveRealignment(
      db,
      FRIDAY,
      { screenHours: 30, spentOnWanting: 40 },
      { hoursToWhatYouLove: 6 },
      'one walk with Eva, phone at home',
    );
    expect(await realignmentDue(db, FRIDAY)).toBe(false);
    expect(await realignmentDue(db, new Date(2026, 5, 15))).toBe(true); // next Monday: due again
    const saved = await realignmentForWeek(db, FRIDAY);
    expect(saved!.commitment).toBe('one walk with Eva, phone at home');
    expect(saved!.ledger.screenHours).toBe(30);
  });
});

describe('RealignFlow (RLG-01..02)', () => {
  it('ledger → values → gap without verdict → commitment → terminal, recalc triggered', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<RealignFlow db={db} onExit={() => {}} />);
    });

    typeInto(tree, 'hours to screens, your honest guess', '32');
    typeInto(tree, 'money to wanting, not needing', '85');
    await press(tree, 'go on');
    typeInto(tree, 'hours to what you love', '5');
    await press(tree, 'go on');

    // The gap: two plain numbers, no adjective, no verdict (RLG-01).
    const gapJson = JSON.stringify(tree.toJSON());
    expect(gapJson).toContain('"32"');
    expect(gapJson).toContain('hours went to the screens.');
    expect(gapJson).toContain('"5"');
    expect(gapJson).toContain('hours reached what you love.');
    expect(gapJson).not.toMatch(/only|wasted|shame|bad/i);

    await press(tree, 'i see it');
    typeInto(
      tree,
      'One commitment for the week ahead — yours, in your words.',
      'phones sleep in the kitchen',
    );
    await press(tree, 'commit');
    expect(JSON.stringify(tree.toJSON())).toContain('The week is read.');

    // Persisted, and the weekly recalc ran (RLG-02).
    expect(await realignmentDue(db, new Date())).toBe(false);
    const scores = await db.execute('SELECT COUNT(*) AS n FROM channel_score');
    expect(scores.rows[0].n).toBe(12);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
