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
import { getQuietState, isUnplugged, startUnplug } from '../quietRepo';
import { t } from '../../../core/content/strings';
import { UnplugFlow } from '../UnplugFlow';

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

const NOON = new Date(2026, 5, 11, 12, 0);

describe('quietRepo — Unplug Mode state (QUIET-01)', () => {
  it('starts quiet, holds through the window, ends silently at the hour', async () => {
    const db = await openDb();
    expect(await isUnplugged(db, NOON)).toBe(false);

    await startUnplug(db, 2, NOON);
    expect(await isUnplugged(db, new Date(2026, 5, 11, 13, 59))).toBe(true);

    // 14:00 — over. Expiry is observed, never announced.
    expect(await isUnplugged(db, new Date(2026, 5, 11, 14, 0))).toBe(false);
    expect((await getQuietState(db, new Date(2026, 5, 11, 14, 0))).mode).toBe('none');
  });

  it('accepts only 1–4 hours (QUIET-01)', async () => {
    const db = await openDb();
    await expect(startUnplug(db, 0.5, NOON)).rejects.toThrow(/1–4 hours/);
    await expect(startUnplug(db, 5, NOON)).rejects.toThrow(/1–4 hours/);
  });
});

describe('UnplugFlow — one tap to the veil', () => {
  it('offers 1–4 h with 2 h as the default, then goes dark', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<UnplugFlow db={db} onExit={() => {}} />);
    });
    const [twoHours] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === '2 hours' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => twoHours.props.onPress());

    expect(JSON.stringify(tree.toJSON())).toContain(t('quiet.veil', 'en'));
    expect(await isUnplugged(db, new Date())).toBe(true);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
