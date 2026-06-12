import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { PATHS, pathById } from '../../../core/content/paths';
import { readingById } from '../../../core/content/readings';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { localDateKey } from '../../../core/storage/time';
import { entriesOn } from '../../journal/journalRepo';
import { PathDayFlow, PathStartFlow } from '../PathFlows';
import { activePath, completePathDay, startPath } from '../pathRepo';

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

const PATH = PATHS[0];
const day = (n: number) => new Date(2026, 5, 12 + (n - 1), 9, 0);

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('paths content (LIB-02)', () => {
  it('runs 7–14 days, each day pointing at a real reading and a real act', () => {
    for (const path of PATHS) {
      expect(path.days.length).toBeGreaterThanOrEqual(7);
      expect(path.days.length).toBeLessThanOrEqual(14);
      for (const d of path.days) {
        expect(readingById(d.readingId)).toBeDefined();
        expect(d.question).toMatch(/\?$/);
        expect(d.act.length).toBeGreaterThan(15);
      }
    }
  });
});

describe('pathRepo (LIB-02)', () => {
  it('one active Path at most; one day per calendar day', async () => {
    const db = await openDb();
    await startPath(db, PATH.id, day(1));
    await expect(startPath(db, PATH.id, day(1))).rejects.toThrow(/One Path at a time/);

    expect((await activePath(db, day(1)))!.dayIndex).toBe(1);
    await completePathDay(db, true, '', day(1));
    const after = (await activePath(db, day(1)))!;
    expect(after.dayIndex).toBe(2);
    expect(after.doneToday).toBe(true); // day two opens tomorrow
    await expect(completePathDay(db, true, '', day(1))).rejects.toThrow(/tomorrow/);
    expect((await activePath(db, day(2)))!.doneToday).toBe(false);
  });

  it('the final day closes with path_reflection Evidence and frees the Path', async () => {
    const db = await openDb();
    await startPath(db, PATH.id, day(1));
    for (let n = 1; n < PATH.days.length; n++) {
      await completePathDay(db, true, '', day(n));
    }
    const last = day(PATH.days.length);
    const walked = await completePathDay(db, true, 'the mornings belong to me again', last);
    expect(walked).toBe(true);
    expect(await activePath(db, last)).toBeNull(); // another may begin, later

    const entries = await entriesOn(db, localDateKey(last));
    const reflection = entries.find((e) => e.type === 'path_reflection');
    expect(reflection).toBeDefined();
    expect(pathById(PATH.id)).toBeDefined();
  });
});

describe('path flows (LIB-02)', () => {
  it('starting offers every path and opens day one of the chosen', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<PathStartFlow db={db} onExit={() => {}} />);
    });
    const json = JSON.stringify(tree.toJSON());
    for (const p of PATHS) expect(json).toContain(p.title);

    await press(tree, PATHS[1].title);
    expect(JSON.stringify(tree.toJSON())).toContain('Day one waits');
    expect((await activePath(db, new Date()))!.path.id).toBe(PATHS[1].id);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('a day walks reading → question → act → kept', async () => {
    const db = await openDb();
    await startPath(db, PATH.id, new Date());
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<PathDayFlow db={db} onExit={() => {}} />);
    });
    await ReactTestRenderer.act(async () => {});
    expect(JSON.stringify(tree.toJSON())).toContain('day 1 of 7');

    await press(tree, 'i have read it');
    expect(JSON.stringify(tree.toJSON())).toContain(PATH.days[0].question);
    await press(tree, 'go on');
    expect(JSON.stringify(tree.toJSON())).toContain(PATH.days[0].act);
    await press(tree, 'done — it happened');
    expect(JSON.stringify(tree.toJSON())).toContain('The next opens tomorrow.');
    expect((await activePath(db, new Date()))!.dayIndex).toBe(2);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
