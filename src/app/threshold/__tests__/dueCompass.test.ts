/**
 * THR-01 / ADR-004 — the due-compass rule: each compass is due in its window
 * and rests once answered for the day.
 */
import { Storage } from '../../../core/storage/Storage';
import {
  ensureProfile,
  getProfile,
  markMorningDone,
  Profile,
} from '../../../core/storage/repos/profileRepo';
import { saveReflection } from '../../../core/storage/repos/reflectionRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { localDateKey } from '../../../core/storage/time';
import { dueCompass, dueCompassToday } from '../dueCompass';

const at = (hours: number, minutes = 0) => new Date(2026, 5, 12, hours, minutes);

function profileWith(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    createdAt: '2026-06-01T08:00:00+02:00',
    displayName: null,
    chosenValues: [],
    morningHour: '07:30',
    eveningHour: '21:30',
    locale: 'en',
    onboardingState: 'complete',
    morningDoneDate: null,
    ...overrides,
  };
}

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

describe('dueCompass (THR-01)', () => {
  it('is quiet before the morning hour', () => {
    expect(dueCompass(profileWith(), false, at(6, 0))).toBeNull();
    expect(dueCompass(profileWith(), false, at(7, 29))).toBeNull();
  });

  it('opens the morning door from the morning hour until the evening hour', () => {
    expect(dueCompass(profileWith(), false, at(7, 30))).toBe('morning');
    expect(dueCompass(profileWith(), false, at(14, 0))).toBe('morning');
    expect(dueCompass(profileWith(), false, at(21, 29))).toBe('morning');
  });

  it('lets the morning rest once done today', () => {
    const done = profileWith({ morningDoneDate: localDateKey(at(8, 0)) });
    expect(dueCompass(done, false, at(8, 0))).toBeNull();
  });

  it("ignores yesterday's morning mark — each day asks once, freshly", () => {
    const stale = profileWith({ morningDoneDate: '2026-06-11' });
    expect(dueCompass(stale, false, at(8, 0))).toBe('morning');
  });

  it('opens the evening door from the evening hour, even if the morning was missed', () => {
    expect(dueCompass(profileWith(), false, at(21, 30))).toBe('evening');
    expect(dueCompass(profileWith(), false, at(23, 59))).toBe('evening');
  });

  it('lets the evening rest once the reflection is folded', () => {
    expect(dueCompass(profileWith(), true, at(22, 0))).toBeNull();
  });

  it('honours user-chosen hours', () => {
    const early = profileWith({ morningHour: '05:00', eveningHour: '20:00' });
    expect(dueCompass(early, false, at(5, 0))).toBe('morning');
    expect(dueCompass(early, false, at(20, 0))).toBe('evening');
  });
});

describe('dueCompassToday (THR-01, against the store)', () => {
  it('derives evening doneness from the Reflection row THR-03 already keeps', async () => {
    const db = await openDb();
    const now = at(22, 0);
    const profile = await ensureProfile(db, now);
    expect(await dueCompassToday(db, profile, now)).toBe('evening');

    await saveReflection(db, { date: localDateKey(now), direction: 0.5 });
    expect(await dueCompassToday(db, profile, now)).toBeNull();
  });

  it('reads the morning-done marker written by markMorningDone (THR-02)', async () => {
    const db = await openDb();
    const now = at(9, 0);
    await ensureProfile(db, now);
    await markMorningDone(db, localDateKey(now));

    const profile = (await getProfile(db))!;
    expect(profile.morningDoneDate).toBe(localDateKey(now));
    expect(await dueCompassToday(db, profile, now)).toBeNull();
  });

  it('rejects a malformed date key', async () => {
    const db = await openDb();
    await ensureProfile(db, at(9, 0));
    await expect(markMorningDone(db, 'today')).rejects.toThrow('Invalid date key');
  });
});
