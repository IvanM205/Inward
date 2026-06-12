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
import { OpeningFlow } from '../OpeningFlow';
import { activeThread, setMicroAct, startThread } from '../threadRepo';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

async function openDbWithThread() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  const db = await storage.open();
  await startThread(db, 'feeds', new Date(2026, 5, 10));
  await setMicroAct(db, 'read one page of the bedside book');
  return db;
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('OpeningFlow (THR-04)', () => {
  it('completing the act writes Evidence on the thread channel and ends terminal', async () => {
    const db = await openDbWithThread();
    const thread = (await activeThread(db))!;
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<OpeningFlow db={db} thread={thread} onExit={() => {}} />);
    });
    expect(JSON.stringify(tree.toJSON())).toContain('read one page of the bedside book');

    await press(tree, 'done — it happened');
    expect(JSON.stringify(tree.toJSON())).toContain('It counts because it happened.');

    const today = localDateKey(new Date());
    const entries = await entriesOn(db, today);
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('care');
    expect(entries[0].origin).toBe('auto');
    expect(entries[0].channelKeys).toEqual(['feeds']); // Evidence reaches the thread
    expect((await activeThread(db))!.openingDoneOn).toBe(today);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('"not today" leaves no trace and no scolding (INV-7)', async () => {
    const db = await openDbWithThread();
    const thread = (await activeThread(db))!;
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<OpeningFlow db={db} thread={thread} onExit={() => {}} />);
    });
    await press(tree, 'not today');
    expect(JSON.stringify(tree.toJSON())).toContain('without keeping score');
    expect(await entriesOn(db, localDateKey(new Date()))).toHaveLength(0);
    expect((await activeThread(db))!.openingDoneOn).toBeNull();
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
