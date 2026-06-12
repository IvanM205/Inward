import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import askCopy from '../../../../persuasion/ask.json';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { AskFlow } from '../AskFlow';
import {
  askAllowed,
  markAskShown,
  markContributed,
  markDeclined,
  openHandState,
  OpenHandState,
} from '../openHandRepo';

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

const NOW = new Date(2026, 5, 12, 20, 0);
const FRESH: OpenHandState = { lastAskShownAt: null, lastContributionAt: null, declinedUntil: null };
const GOOD_MOMENT = { justCompleted: 'reading' as const, inCraving: false, inQuiet: false, inOnboarding: false };

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('askAllowed — the whole of OPEN-02', () => {
  it('allows only a good moment, outside cravings, the Quiet, and onboarding', () => {
    expect(askAllowed(FRESH, GOOD_MOMENT, NOW)).toBe(true);
    expect(askAllowed(FRESH, { ...GOOD_MOMENT, justCompleted: null }, NOW)).toBe(false);
    expect(askAllowed(FRESH, { ...GOOD_MOMENT, inCraving: true }, NOW)).toBe(false);
    expect(askAllowed(FRESH, { ...GOOD_MOMENT, inQuiet: true }, NOW)).toBe(false);
    expect(askAllowed(FRESH, { ...GOOD_MOMENT, inOnboarding: true }, NOW)).toBe(false);
  });

  it('asks at most once a month and never asks a giver twice', () => {
    const shownThisMonth = { ...FRESH, lastAskShownAt: '2026-06-02T10:00:00+02:00' };
    expect(askAllowed(shownThisMonth, GOOD_MOMENT, NOW)).toBe(false);
    const shownLastMonth = { ...FRESH, lastAskShownAt: '2026-05-12T10:00:00+02:00' };
    expect(askAllowed(shownLastMonth, GOOD_MOMENT, NOW)).toBe(true);
    const gaveThisMonth = { ...FRESH, lastContributionAt: '2026-06-03T10:00:00+02:00' };
    expect(askAllowed(gaveThisMonth, GOOD_MOMENT, NOW)).toBe(false);
  });

  it('a decline holds for thirty days', () => {
    const declined = { ...FRESH, declinedUntil: '2026-07-05T20:00:00+02:00' };
    expect(askAllowed(declined, GOOD_MOMENT, NOW)).toBe(false);
    expect(askAllowed(declined, GOOD_MOMENT, new Date(2026, 6, 6))).toBe(true);
  });
});

describe('the state dates (03 §OpenHandState)', () => {
  it('records shown, declined (+30 days), contributed', async () => {
    const db = await openDb();
    await markAskShown(db, NOW);
    await markDeclined(db, NOW);
    await markContributed(db, NOW);
    const state = await openHandState(db);
    expect(state.lastAskShownAt).toContain('2026-06-12');
    expect(state.declinedUntil).toContain('2026-07-12'); // thirty quiet days
    expect(state.lastContributionAt).toContain('2026-06-12');
  });
});

describe('AskFlow (OPEN-03)', () => {
  it('shows the published copy; declining is one tap with zero guilt', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<AskFlow db={db} onExit={() => {}} />);
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain(askCopy.lead);
    for (const amount of askCopy.amounts) expect(json).toContain(amount);

    await press(tree, askCopy.decline);
    expect(JSON.stringify(tree.toJSON())).toContain('Everything stays exactly as it is.');
    expect((await openHandState(db)).declinedUntil).not.toBeNull();
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('giving thanks plainly and promises nothing extra (INV-8)', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<AskFlow db={db} onExit={() => {}} />);
    });
    await press(tree, askCopy.suggested);
    expect(JSON.stringify(tree.toJSON())).toContain('it was already all yours');
    expect((await openHandState(db)).lastContributionAt).not.toBeNull();
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('shows the supporter line only when the count arrives (OPEN-04)', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <AskFlow db={db} supporterCount={{ fetch: async () => 412 }} onExit={() => {}} />,
      );
    });
    await ReactTestRenderer.act(async () => {});
    expect(JSON.stringify(tree.toJSON())).toContain('supported by 412 people this month');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
