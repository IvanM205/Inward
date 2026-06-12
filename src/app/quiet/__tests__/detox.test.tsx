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
import { localDateKey } from '../../../core/storage/time';
import { entriesOn } from '../../journal/journalRepo';
import { DetoxCheckinFlow, DetoxStartFlow } from '../DetoxFlows';
import {
  activeDetox,
  completeDetox,
  detoxCheckin,
  detoxFocus,
  getQuietState,
  startDetox,
} from '../quietRepo';

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

const DAY1 = new Date(2026, 5, 12, 9, 0);
const dayN = (n: number) => new Date(2026, 5, 12 + (n - 1), 9, 0);

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('detoxFocus — shorter feeds first (QUIET-02)', () => {
  it('clears one channel in the first third, all by the last', () => {
    const red = ['feeds', 'series', 'games'] as const;
    expect(detoxFocus([...red], 1, 14)).toEqual(['feeds']);
    expect(detoxFocus([...red], 7, 14)).toEqual(['feeds', 'series']);
    expect(detoxFocus([...red], 14, 14)).toEqual(['feeds', 'series', 'games']);
    expect(detoxFocus(['feeds'], 1, 7)).toEqual(['feeds']);
  });
});

describe('detox lifecycle (QUIET-02)', () => {
  it('runs day by day and finishes past the final day', async () => {
    const db = await openDb();
    await startDetox(db, 7, ['feeds', 'series'], DAY1);
    expect((await getQuietState(db, DAY1)).mode).toBe('detox');

    const day1 = (await activeDetox(db, DAY1))!;
    expect(day1.dayIndex).toBe(1);
    expect(day1.finished).toBe(false);

    const day7 = (await activeDetox(db, dayN(7)))!;
    expect(day7.dayIndex).toBe(7);
    expect(day7.finished).toBe(false);

    const day8 = (await activeDetox(db, dayN(8)))!;
    expect(day8.finished).toBe(true); // only the closing question remains
  });

  it('check-ins write Evidence on the red list; closing ends the program', async () => {
    const db = await openDb();
    await startDetox(db, 7, ['feeds'], DAY1);
    await detoxCheckin(db, 'reached for it twice, breathed instead', DAY1);
    const entries = await entriesOn(db, localDateKey(DAY1));
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('care');
    expect(entries[0].channelKeys).toEqual(['feeds']);
    expect((await activeDetox(db, DAY1))!.state.lastCheckinOn).toBe(localDateKey(DAY1));

    await completeDetox(db, 'mornings feel longer, in a good way', dayN(8));
    expect(await activeDetox(db, dayN(8))).toBeNull();
    expect((await getQuietState(db, dayN(8))).mode).toBe('none');
    const closing = await entriesOn(db, localDateKey(dayN(8)));
    expect(closing[0].type).toBe('path_reflection');
  });

  it('refuses an empty red list', async () => {
    const db = await openDb();
    await expect(startDetox(db, 7, [], DAY1)).rejects.toThrow(/red list/);
  });
});

describe('detox flows (QUIET-02)', () => {
  it('start: program → red list → begun', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<DetoxStartFlow db={db} onExit={() => {}} />);
    });
    await press(tree, 'fourteen days');
    await press(tree, 'feeds & shorts');
    await press(tree, 'series & streaming');
    await press(tree, 'begin the clearing');
    expect(JSON.stringify(tree.toJSON())).toContain('The clearing has begun.');

    const detox = (await activeDetox(db, new Date()))!;
    expect(detox.state.program).toBe(14);
    expect(detox.state.redList).toEqual(['feeds', 'series']);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('check-in: one line kept, the clearing holds', async () => {
    const db = await openDb();
    await startDetox(db, 7, ['feeds'], new Date());
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<DetoxCheckinFlow db={db} onExit={() => {}} />);
    });
    await ReactTestRenderer.act(async () => {});
    expect(JSON.stringify(tree.toJSON())).toContain('day 1 of 7');

    const input = tree.root.find(
      (n) =>
        n.props.accessibilityLabel === 'One line about today.' &&
        typeof n.props.onChangeText === 'function',
    );
    ReactTestRenderer.act(() => input.props.onChangeText('did not open it before noon'));
    await press(tree, 'keep it');
    expect(JSON.stringify(tree.toJSON())).toContain('The clearing holds');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
