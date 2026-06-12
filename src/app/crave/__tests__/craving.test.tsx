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
import { activeThread, startThread } from '../../plan/threadRepo';
import { CravingFlow, CRAVING_BREATH_MS } from '../CravingFlow';
import { recordCraving } from '../cravingRepo';
import { suggestAction } from '../suggestions';

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

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('suggestAction (CRAVE-02)', () => {
  it('suggests by hunger and time of day, always pointing out of the phone', () => {
    const noon = new Date(2026, 5, 12, 12, 0);
    const night = new Date(2026, 5, 12, 23, 0);
    expect(suggestAction('connection', noon)).toContain('Call someone');
    expect(suggestAction('connection', night)).toContain('in the morning');
    expect(suggestAction('rest', night)).toContain('wind-down');
    expect(suggestAction('body', noon)).toContain('outside');
    expect(suggestAction('unsure', noon)).toContain('window');
  });
});

describe('recordCraving (CRAVE-03, 04 §2.1)', () => {
  it('tags the channel only when the action was taken', async () => {
    const db = await openDb();
    const now = new Date(2026, 5, 12, 15, 0);
    await recordCraving(
      db,
      { channelKey: 'feeds', hunger: 'rest', actionSuggested: 'x', actionTaken: true, note: null },
      now,
    );
    await recordCraving(
      db,
      { channelKey: 'feeds', hunger: 'rest', actionSuggested: 'x', actionTaken: false, note: null },
      new Date(2026, 5, 12, 16, 0),
    );
    const entries = await entriesOn(db, '2026-06-12');
    expect(entries).toHaveLength(2);
    expect(entries[0].channelKeys).toEqual(['feeds']); // taken → weighs
    expect(entries[1].channelKeys).toEqual([]); // not taken → recorded, weightless
    const events = await db.execute('SELECT action_taken FROM craving_event ORDER BY created_at');
    expect(events.rows.map((r) => r.action_taken)).toEqual([1, 0]);
  });
});

describe('CravingFlow (CRAVE-01..03)', () => {
  it('breath → hunger → action → note → terminal, everything recorded', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', new Date(2026, 5, 10));
    const thread = await activeThread(db);
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<CravingFlow db={db} thread={thread} onExit={() => {}} />);
    });

    // 90 breathed seconds — animation only, no text demanded of anyone.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(CRAVING_BREATH_MS);
    });
    await ReactTestRenderer.act(async () => {});
    expect(JSON.stringify(tree.toJSON())).toContain('What are you actually hungry for?');

    await press(tree, 'rest');
    expect(JSON.stringify(tree.toJSON())).toContain('phone in another room');

    await press(tree, 'i’ll do it');
    await press(tree, 'done');
    expect(JSON.stringify(tree.toJSON())).toContain('The hunger was real.');

    const entries = await entriesOn(db, localDateKey(new Date()));
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('craving_decoded');
    expect(entries[0].channelKeys).toEqual(['feeds']);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('the breath is skippable after three seconds — never a cage (CRAVE-02)', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<CravingFlow db={db} thread={null} onExit={() => {}} />);
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await press(tree, 'skip');
    expect(JSON.stringify(tree.toJSON())).toContain('What are you actually hungry for?');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
