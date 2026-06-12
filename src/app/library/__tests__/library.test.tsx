import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { READINGS } from '../../../core/content/readings';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { archive, logReadingRead, revisit, todaysReading } from '../libraryRepo';
import { ReadingFlow } from '../ReadingFlow';

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

const TODAY = new Date(2026, 5, 12, 8, 0);
const TOMORROW = new Date(2026, 5, 13, 8, 0);

describe('readings content (LIB-01, ADR-001)', () => {
  it('reads in two to four minutes, kindly, for all people with good heart', () => {
    expect(READINGS.length).toBeGreaterThanOrEqual(7);
    for (const r of READINGS) {
      const words = r.body.join(' ').split(/\s+/).length;
      expect(words).toBeGreaterThan(100); // ~2 min at reading pace
      expect(words).toBeLessThan(600); // ~4 min ceiling
      expect(r.closingQuestion).toMatch(/\?$/);
      expect(r.body.join(' ')).not.toMatch(/!/); // 06 §Copy voice
    }
  });
});

describe('todaysReading — one per day, rotation not recommendation (LIB-01/05)', () => {
  it('is stable within a day and different the next day', () => {
    expect(todaysReading(TODAY).id).toBe(todaysReading(new Date(2026, 5, 12, 23, 0)).id);
    expect(todaysReading(TOMORROW).id).not.toBe(todaysReading(TODAY).id);
  });
});

describe('the archive is not a feed (INV-1)', () => {
  it('allows exactly one revisit per day across the whole archive', async () => {
    const db = await openDb();
    // Two past readings in the log.
    await logReadingRead(db, READINGS[0], new Date(2026, 5, 10));
    await logReadingRead(db, READINGS[1], new Date(2026, 5, 11));
    expect(await archive(db, TODAY)).toHaveLength(2);

    const first = await revisit(db, READINGS[0].id, TODAY);
    expect(first!.id).toBe(READINGS[0].id);
    const second = await revisit(db, READINGS[1].id, TODAY);
    expect(second).toBeNull(); // tomorrow, gladly

    expect(await revisit(db, READINGS[1].id, TOMORROW)).not.toBeNull();
  });
});

describe('ReadingFlow (LIB-01)', () => {
  it('renders the piece like a book and ends pointing outward', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <ReadingFlow db={db} reading={READINGS[0]} onExit={() => {}} />,
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain(READINGS[0].title);
    expect(json).toContain(READINGS[0].closingQuestion);

    const [done] = tree.root.findAll(
      (n) =>
        n.props.accessibilityLabel === 'i have read it' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => done.props.onPress());
    expect(JSON.stringify(tree.toJSON())).toContain('Now go live it.');

    const log = await db.execute('SELECT reading_id FROM reading_log');
    expect(log.rows).toHaveLength(1);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
