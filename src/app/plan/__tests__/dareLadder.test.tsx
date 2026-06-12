import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { DARE_TEMPLATES } from '../../../core/content/dareTemplates';
import { CHANNEL_KEYS } from '../../../core/scoring/config';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { localDateKey } from '../../../core/storage/time';
import { entriesOn } from '../../journal/journalRepo';
import { completeDare, dueDare, ladder, seedLadder, skipDare } from '../dareRepo';
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
  await startThread(db, 'feeds', new Date(2026, 5, 1));
  await setMicroAct(db, 'read one page');
  const thread = (await activeThread(db))!;
  await seedLadder(db, thread);
  return { db, thread };
}

const TODAY = new Date(2026, 5, 12, 9, 0);

describe('dare templates (PLAN-02)', () => {
  it('offers seven escalating rungs for every channel, no urgency words', () => {
    for (const key of CHANNEL_KEYS) {
      expect(DARE_TEMPLATES[key]).toHaveLength(7);
      for (const text of DARE_TEMPLATES[key]) {
        expect(text.length).toBeGreaterThan(15);
        expect(text).not.toMatch(/!/); // 06 §Copy voice
      }
    }
  });
});

describe('dareRepo (PLAN-02/04)', () => {
  it('seeds once, idempotently', async () => {
    const { db, thread } = await openDbWithThread();
    await seedLadder(db, thread); // second call is a no-op
    expect(await ladder(db, thread.id)).toHaveLength(7);
  });

  it('offers the lowest waiting rung, and the same dare all day', async () => {
    const { db, thread } = await openDbWithThread();
    const first = await dueDare(db, thread.id, TODAY);
    expect(first!.rung).toBe(1);
    const again = await dueDare(db, thread.id, TODAY);
    expect(again!.id).toBe(first!.id); // stays offered, not re-drawn
  });

  it('rests a week between dares (THR-04: one act a day, dares weekly)', async () => {
    const { db, thread } = await openDbWithThread();
    const first = (await dueDare(db, thread.id, TODAY))!;
    await completeDare(db, first, thread, 'lighter than expected', TODAY);
    expect(await dueDare(db, thread.id, new Date(2026, 5, 14))).toBeNull(); // resting
    const next = await dueDare(db, thread.id, new Date(2026, 5, 19));
    expect(next!.rung).toBe(2); // a week later, the next rung
  });

  it('completing writes dare_done Evidence with the feeling answer', async () => {
    const { db, thread } = await openDbWithThread();
    const dare = (await dueDare(db, thread.id, TODAY))!;
    await completeDare(db, dare, thread, 'strange and good', TODAY);
    const entries = await entriesOn(db, localDateKey(TODAY));
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('dare_done');
    expect(entries[0].channelKeys).toEqual(['feeds']);
    const rungs = await ladder(db, thread.id);
    expect(rungs[0].status).toBe('done');
    expect(rungs[0].feelingAnswer).toBe('strange and good');
  });

  it('skipping never resets the ladder — it waits (PLAN-04, INV-7)', async () => {
    const { db, thread } = await openDbWithThread();
    const dare = (await dueDare(db, thread.id, TODAY))!;
    await skipDare(db, dare, TODAY);
    const rungs = await ladder(db, thread.id);
    expect(rungs[0].status).toBe('skipped');
    expect(rungs.filter((d) => d.status === 'waiting')).toHaveLength(6); // nothing reset
    const next = await dueDare(db, thread.id, new Date(2026, 5, 19));
    expect(next!.rung).toBe(2); // the ladder simply continues
  });
});

describe('OpeningFlow with a due dare (THR-04)', () => {
  it('offers the dare over the micro-act and records the feeling', async () => {
    const { db, thread } = await openDbWithThread();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<OpeningFlow db={db} thread={thread} onExit={() => {}} />);
    });
    await ReactTestRenderer.act(async () => {});
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('rung 1 of 7');
    expect(json).toContain(DARE_TEMPLATES.feeds[0]);

    const input = tree.root.find(
      (n) =>
        n.props.accessibilityLabel === 'done — how did it feel?' &&
        typeof n.props.onChangeText === 'function',
    );
    ReactTestRenderer.act(() => input.props.onChangeText('quiet, surprisingly'));
    const [done] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'it is done' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => done.props.onPress());

    expect(JSON.stringify(tree.toJSON())).toContain('It counts because it happened.');
    const entries = await entriesOn(db, localDateKey(new Date()));
    expect(entries[0].type).toBe('dare_done');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
