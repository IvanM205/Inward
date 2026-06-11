import { ENTRY_WEIGHTS } from '../../../core/scoring/config';
import { evidenceOffset } from '../../../core/scoring/engine';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import {
  addEntry,
  countedEntriesSince,
  entriesOn,
  searchEntries,
} from '../journalRepo';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const SPECIFIC = 'called my brother Tomáš after dinner';
const EVENING = new Date(2026, 5, 11, 21, 40);

describe('journal addEntry — counting rules at save time (04 §2.2)', () => {
  it('saves and counts a specific entry at its base weight', async () => {
    const db = await openDb();
    const saved = await addEntry(
      db,
      { type: 'kindness', text: SPECIFIC, channelKeys: ['relationships'], origin: 'evening' },
      EVENING,
    );
    expect(saved.counted).toBe(true);
    expect(saved.weight).toBeCloseTo(ENTRY_WEIGHTS.kindness);
  });

  it('saves but does not count a vague entry — written for the soul, not the score', async () => {
    const db = await openDb();
    const saved = await addEntry(
      db,
      { type: 'kindness', text: 'was nice today', channelKeys: [], origin: 'evening' },
      EVENING,
    );
    expect(saved.counted).toBe(false);
    expect(saved.weight).toBe(0);
    expect(await entriesOn(db, '2026-06-11')).toHaveLength(1); // still saved
  });

  it('counts max 1 per manual type per day', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'kindness', text: SPECIFIC, channelKeys: [], origin: 'evening' },
      EVENING,
    );
    const second = await addEntry(
      db,
      {
        type: 'kindness',
        text: 'carried groceries home for the old neighbour',
        channelKeys: [],
        origin: 'widget',
      },
      new Date(2026, 5, 11, 22, 0),
    );
    expect(second.counted).toBe(false);
    // A different manual type the same day still counts.
    const care = await addEntry(
      db,
      { type: 'care', text: 'deleted the feeds app from my phone', channelKeys: ['feeds'], origin: 'evening' },
      new Date(2026, 5, 11, 22, 5),
    );
    expect(care.counted).toBe(true);
  });

  it('counts max 3 entries per day across all types', async () => {
    const db = await openDb();
    const texts = [
      'called my brother Tomáš after dinner',
      'deleted the feeds app from my phone',
      'planted tomatoes in the garden with Eva',
      'walked the long way home past the river',
    ];
    const types = ['kindness', 'care', 'aliveness', 'dare_done'] as const;
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(
        await addEntry(
          db,
          { type: types[i], text: texts[i], channelKeys: [], origin: 'evening' },
          new Date(2026, 5, 11, 20, i),
        ),
      );
    }
    expect(results.slice(0, 3).every((e) => e.counted)).toBe(true);
    expect(results[3].counted).toBe(false); // 4th of the day, capped
  });

  it('halves the weight per near-duplicate in the 14-day window', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'aliveness', text: 'watched the sunrise from the balcony', channelKeys: [], origin: 'widget' },
      new Date(2026, 5, 9, 6, 0),
    );
    const repeat = await addEntry(
      db,
      { type: 'aliveness', text: 'watched the sunrise from the balcony', channelKeys: [], origin: 'widget' },
      new Date(2026, 5, 11, 6, 0),
    );
    expect(repeat.repeatIndex).toBe(1);
    expect(repeat.weight).toBeCloseTo(ENTRY_WEIGHTS.aliveness * 0.5);
  });

  it('an entry 15+ days old no longer triggers diminishing returns', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'aliveness', text: 'watched the sunrise from the balcony', channelKeys: [], origin: 'widget' },
      new Date(2026, 4, 20, 6, 0), // 22 days earlier
    );
    const later = await addEntry(
      db,
      { type: 'aliveness', text: 'watched the sunrise from the balcony', channelKeys: [], origin: 'widget' },
      EVENING,
    );
    expect(later.repeatIndex).toBe(0);
    expect(later.weight).toBeCloseTo(ENTRY_WEIGHTS.aliveness);
  });
});

describe('journal queries feed the score and the user — never a feed', () => {
  it('countedEntriesSince shapes entries for the scoring engine (04 §2)', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'kindness', text: SPECIFIC, channelKeys: ['relationships'], origin: 'evening' },
      EVENING,
    );
    await addEntry(
      db,
      { type: 'kindness', text: 'was nice', channelKeys: ['relationships'], origin: 'evening' },
      EVENING,
    );
    const counted = await countedEntriesSince(db, EVENING, 28);
    expect(counted).toHaveLength(1);
    expect(evidenceOffset(counted, 'relationships')).toBeCloseTo(ENTRY_WEIGHTS.kindness);
  });

  it('searchEntries finds the user’s own words (JRN-05)', async () => {
    const db = await openDb();
    await addEntry(
      db,
      { type: 'kindness', text: SPECIFIC, channelKeys: [], origin: 'evening' },
      EVENING,
    );
    expect(await searchEntries(db, 'Tomáš')).toHaveLength(1);
    expect(await searchEntries(db, 'sunset')).toHaveLength(0);
  });
});
