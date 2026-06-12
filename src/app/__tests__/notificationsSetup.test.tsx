import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import notificationLines from '../../../persuasion/notifications.json';
import { NotificationScheduler, NotificationSlot, SlotSchedule } from '../../core/notifications/scheduler';
import { Storage } from '../../core/storage/Storage';
import { ensureProfile, setCompassHours } from '../../core/storage/repos/profileRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../core/storage/testing/fakes';
import { enableCompassLines } from '../notificationsSetup';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { BREATH_TOTAL_MS } from '../onboarding/BreathScreen';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

class RecordingAdapter {
  scheduled: Array<{ slot: NotificationSlot; schedule: SlotSchedule }> = [];
  async scheduleDaily(slot: NotificationSlot, schedule: SlotSchedule): Promise<void> {
    this.scheduled.push({ slot, schedule });
  }
  async cancel(): Promise<void> {}
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

describe('the persuasion directory (NFR-P5)', () => {
  it('holds exactly the two neutral lines INV-4 allows', () => {
    const slots = Object.keys(notificationLines).filter((k) => !k.startsWith('_'));
    expect(slots.sort()).toEqual(['evening', 'morning']);
    for (const slot of slots) {
      const line = (notificationLines as Record<string, string>)[slot];
      expect(line).not.toMatch(/!/);
      expect(line).not.toMatch(/\d/); // no deltas, no counts, no scores
      expect(line).not.toMatch(/miss|last|now\b|hurry|don.t/i);
    }
  });
});

describe('enableCompassLines (NTF-01)', () => {
  it('schedules both slots at the chosen hours, silent, with the published lines', async () => {
    const db = await openDb();
    await ensureProfile(db, new Date(2026, 5, 12));
    await setCompassHours(db, '06:45', '22:15');
    const adapter = new RecordingAdapter();

    await enableCompassLines(db, new NotificationScheduler(adapter));

    expect(adapter.scheduled).toHaveLength(2);
    const morning = adapter.scheduled.find((s) => s.slot === 'morning')!;
    expect(morning.schedule).toEqual({
      hour: 6,
      minute: 45,
      line: notificationLines.morning,
      sound: false,
    });
    const evening = adapter.scheduled.find((s) => s.slot === 'evening')!;
    expect(evening.schedule.hour).toBe(22);
    expect(evening.schedule.sound).toBe(false); // silent by default (INV-4)
  });
});

describe('ONB-03 grant wires the slots', () => {
  it('granting notifications during onboarding schedules the compass lines', async () => {
    const db = await openDb();
    const adapter = new RecordingAdapter();
    const scheduler = new NotificationScheduler(adapter);
    const permissions = {
      requestNotifications: jest.fn().mockResolvedValue(true),
      requestScreenTime: jest.fn().mockResolvedValue(false),
    };
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <OnboardingFlow
          db={db}
          permissions={permissions}
          onNotificationsGranted={() => enableCompassLines(db, scheduler)}
          onExit={() => {}}
        />,
      );
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(BREATH_TOTAL_MS);
    });
    await ReactTestRenderer.act(async () => {});

    const [goOn] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'go on' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => goOn.props.onPress());
    const [yes] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'yes' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => yes.props.onPress());

    expect(adapter.scheduled.map((s) => s.slot).sort()).toEqual(['evening', 'morning']);
    expect(adapter.scheduled[0].schedule.hour).toBe(7); // the 07:30 default (THR-02)
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('a refusal schedules nothing — degradation is only the signal (ONB-03)', async () => {
    const db = await openDb();
    const adapter = new RecordingAdapter();
    const scheduler = new NotificationScheduler(adapter);
    const permissions = {
      requestNotifications: jest.fn().mockResolvedValue(false),
      requestScreenTime: jest.fn().mockResolvedValue(false),
    };
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <OnboardingFlow
          db={db}
          permissions={permissions}
          onNotificationsGranted={() => enableCompassLines(db, scheduler)}
          onExit={() => {}}
        />,
      );
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(BREATH_TOTAL_MS);
    });
    await ReactTestRenderer.act(async () => {});
    const [goOn] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'go on' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => goOn.props.onPress());
    const [yes] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'yes' && typeof n.props.onPress === 'function',
    );
    await ReactTestRenderer.act(async () => yes.props.onPress());

    expect(adapter.scheduled).toHaveLength(0);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
