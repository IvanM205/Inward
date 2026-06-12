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
import {
  clearStillness,
  getStillness,
  isStillnessNow,
  setStillness,
  stillnessHolds,
} from '../quietRepo';
import { StillnessFlow } from '../StillnessFlow';

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

const SUNDAY_MORNING = new Date(2026, 5, 14, 9, 0); // a Sunday
const SUNDAY_NOON = new Date(2026, 5, 14, 12, 0);
const MONDAY_MORNING = new Date(2026, 5, 15, 9, 0);

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('stillness recurrence (QUIET-03)', () => {
  it('holds inside the weekly window and nowhere else', () => {
    const window = { weekday: 0, startHour: 8, hours: 3 };
    expect(stillnessHolds(window, SUNDAY_MORNING)).toBe(true);
    expect(stillnessHolds(window, SUNDAY_NOON)).toBe(false); // 11:00 ended it
    expect(stillnessHolds(window, MONDAY_MORNING)).toBe(false);
    expect(stillnessHolds(null, SUNDAY_MORNING)).toBe(false);
  });

  it('persists the designed window; clearing removes the defense', async () => {
    const db = await openDb();
    await setStillness(db, { weekday: 0, startHour: 8, hours: 3 });
    expect(await getStillness(db)).toEqual({ weekday: 0, startHour: 8, hours: 3 });
    expect(await isStillnessNow(db, SUNDAY_MORNING)).toBe(true);
    await clearStillness(db);
    expect(await isStillnessNow(db, SUNDAY_MORNING)).toBe(false);
  });

  it('rejects a window that crosses midnight or nonsense hours', async () => {
    const db = await openDb();
    await expect(setStillness(db, { weekday: 0, startHour: 23, hours: 3 })).rejects.toThrow(
      /one day/,
    );
    await expect(setStillness(db, { weekday: 9, startHour: 8, hours: 2 })).rejects.toThrow();
  });
});

describe('StillnessFlow — designed once (QUIET-03)', () => {
  it('weekday → window → kept, and the window is stored', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<StillnessFlow db={db} onExit={() => {}} />);
    });
    await press(tree, 'sunday');
    expect(JSON.stringify(tree.toJSON())).toContain('From which hour');
    await press(tree, 'keep this window');
    expect(JSON.stringify(tree.toJSON())).toContain('The window is kept.');
    expect(await getStillness(db)).toEqual({ weekday: 0, startHour: 8, hours: 3 });
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
