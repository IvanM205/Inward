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
import { addEntry } from '../journalRepo';
import { t } from '../../../core/content/strings';
import { JournalScreen } from '../JournalScreen';

const SOUL_NOT_SCORE = t('journal.soulNotScore', 'en');

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

const NOW = new Date(2026, 5, 12, 21, 0);

async function mount(db: Awaited<ReturnType<typeof openDb>>) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<JournalScreen db={db} onClose={() => {}} />);
  });
  await ReactTestRenderer.act(async () => {});
  return tree;
}

describe('JournalScreen (JRN-04/05)', () => {
  it('shows the words with a visible end, and marks uncounted entries gently', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'kindness', text: 'called my brother Tomáš after dinner', channelKeys: [], origin: 'evening' },
      NOW,
    );
    await addEntry(
      db,
      { type: 'aliveness', text: 'was glad', channelKeys: [], origin: 'widget' }, // too vague to count
      NOW,
    );
    const tree = await mount(db);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('called my brother Tomáš after dinner');
    expect(json).toContain('was glad');
    expect(json).toContain(SOUL_NOT_SCORE); // once, for the uncounted one
    expect(json.split(SOUL_NOT_SCORE)).toHaveLength(2);
    expect(json).toContain('the beginning'); // the visible end (INV-1)
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('search narrows to the person’s own words (JRN-05)', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'kindness', text: 'called my brother Tomáš after dinner', channelKeys: [], origin: 'evening' },
      NOW,
    );
    await addEntry(
      db,
      { type: 'care', text: 'deleted the feeds app from my phone', channelKeys: [], origin: 'evening' },
      NOW,
    );
    const tree = await mount(db);
    const input = tree.root.find(
      (n) =>
        n.props.accessibilityLabel === 'find your own words' &&
        typeof n.props.onChangeText === 'function',
    );
    await ReactTestRenderer.act(async () => input.props.onChangeText('Tomáš'));
    await ReactTestRenderer.act(async () => {});
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Tomáš');
    expect(json).not.toContain('deleted the feeds app');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('an empty journal says so kindly, without a prompt to fill it', async () => {
    const db = await openDb();
    const tree = await mount(db);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('nothing here yet');
    expect(json).not.toMatch(/should|must|start now/i);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
