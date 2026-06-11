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
import { entriesOn } from '../journalRepo';
import { CAPTURE_PROMPT, WidgetCaptureFlow } from '../WidgetCaptureFlow';

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

describe('WidgetCaptureFlow (JRN-03)', () => {
  it('keeps one aliveness line and releases the user', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<WidgetCaptureFlow db={db} onExit={() => {}} />);
    });

    const input = tree.root.find(
      (n) =>
        n.props.accessibilityLabel === CAPTURE_PROMPT &&
        typeof n.props.onChangeText === 'function',
    );
    ReactTestRenderer.act(() => input.props.onChangeText('watched the storm roll in from the porch'));

    const [keep] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'keep it' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => keep.props.onPress());

    expect(JSON.stringify(tree.toJSON())).toContain('Kept. Now stay with it.');
    const entries = await entriesOn(db, localDateKey(new Date()));
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('aliveness');
    expect(entries[0].origin).toBe('widget');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('keeps nothing when the line is empty — still ends, never nags', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<WidgetCaptureFlow db={db} onExit={() => {}} />);
    });
    const [keep] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'keep it' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => keep.props.onPress());
    expect(await entriesOn(db, localDateKey(new Date()))).toHaveLength(0);
    expect(JSON.stringify(tree.toJSON())).toContain('Kept. Now stay with it.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
