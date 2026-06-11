import { Storage } from '../Storage';
import {
  ensureProfile,
  getProfile,
  setCompassHours,
  setOnboardingState,
} from '../repos/profileRepo';
import {
  needleDirection,
  reflectionForDate,
  saveReflection,
} from '../repos/reflectionRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../testing/fakes';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const NOW = new Date(2026, 5, 11, 21, 30); // 2026-06-11 21:30 local

describe('profileRepo — the singleton profile (03 §Profile, ONB-05)', () => {
  it('creates the profile on first launch with spec defaults', async () => {
    const db = await openDb();
    const profile = await ensureProfile(db, NOW);
    expect(profile.morningHour).toBe('07:30'); // THR-02 default
    expect(profile.eveningHour).toBe('21:30'); // THR-03 default
    expect(profile.onboardingState).toBe('breath_done');
    expect(profile.chosenValues).toEqual([]);
    expect(profile.displayName).toBeNull(); // no account, no email (ONB-05)
  });

  it('is a singleton — ensureProfile twice returns the same row', async () => {
    const db = await openDb();
    const first = await ensureProfile(db, NOW);
    const second = await ensureProfile(db, new Date(2026, 5, 12));
    expect(second.id).toBe(first.id);
  });

  it('advances onboarding state and rejects unknown states', async () => {
    const db = await openDb();
    await ensureProfile(db, NOW);
    await setOnboardingState(db, 'sentence_done');
    expect((await getProfile(db))!.onboardingState).toBe('sentence_done');
    await expect(setOnboardingState(db, 'streaking' as never)).rejects.toThrow(/Unknown/);
  });

  it('stores user-chosen compass hours and rejects malformed ones', async () => {
    const db = await openDb();
    await ensureProfile(db, NOW);
    await setCompassHours(db, '06:45', '22:00');
    const profile = (await getProfile(db))!;
    expect(profile.morningHour).toBe('06:45');
    expect(profile.eveningHour).toBe('22:00');
    await expect(setCompassHours(db, '25:00', '21:30')).rejects.toThrow(/Invalid hour/);
  });
});

describe('reflectionRepo — evening Compass & the Needle (THR-03, 03 §Reflection)', () => {
  it('saves a reflection and reads it back by date', async () => {
    const db = await openDb();
    await saveReflection(db, {
      date: '2026-06-11',
      direction: 0.4,
      line: 'walked instead of scrolled',
      gratitudes: ['Mara', 'the rain'],
    });
    const saved = await reflectionForDate(db, '2026-06-11');
    expect(saved!.direction).toBeCloseTo(0.4);
    expect(saved!.gratitudes).toEqual(['Mara', 'the rain']);
  });

  it('keeps one reflection per date — re-running the evening replaces it', async () => {
    const db = await openDb();
    await saveReflection(db, { date: '2026-06-11', direction: -0.5 });
    await saveReflection(db, { date: '2026-06-11', direction: 0.2 });
    const saved = await reflectionForDate(db, '2026-06-11');
    expect(saved!.direction).toBeCloseTo(0.2);
  });

  it('rejects out-of-range direction and more than 3 gratitudes (THR-03)', async () => {
    const db = await openDb();
    await expect(saveReflection(db, { date: '2026-06-11', direction: 1.5 })).rejects.toThrow(
      /direction/,
    );
    await expect(
      saveReflection(db, {
        date: '2026-06-11',
        direction: 0,
        gratitudes: ['a', 'b', 'c', 'd'],
      }),
    ).rejects.toThrow(/gratitudes/);
  });

  it('needle is the mean over the trailing 90 days only (04 §5)', async () => {
    const db = await openDb();
    await saveReflection(db, { date: '2026-06-10', direction: 1.0 });
    await saveReflection(db, { date: '2026-06-11', direction: 0.0 });
    // 91 days before 2026-06-11 — outside the window, must not pull the mean.
    await saveReflection(db, { date: '2026-03-12', direction: -1.0 });
    const mean = await needleDirection(db, NOW);
    expect(mean).toBeCloseTo(0.5);
  });

  it('needle rests at null when nothing has been reflected yet', async () => {
    const db = await openDb();
    expect(await needleDirection(db, NOW)).toBeNull();
  });
});
