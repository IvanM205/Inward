import {
  NotificationAdapter,
  NotificationScheduler,
  NotificationSlot,
  SLOTS,
  SlotSchedule,
} from '../scheduler';

class FakeAdapter implements NotificationAdapter {
  scheduled = new Map<NotificationSlot, SlotSchedule>();

  async scheduleDaily(slot: NotificationSlot, schedule: SlotSchedule) {
    this.scheduled.set(slot, schedule);
  }
  async cancel(slot: NotificationSlot) {
    this.scheduled.delete(slot);
  }
}

describe('NotificationScheduler (INV-4, NTF-01, NFR-A2)', () => {
  let adapter: FakeAdapter;
  let scheduler: NotificationScheduler;

  beforeEach(() => {
    adapter = new FakeAdapter();
    scheduler = new NotificationScheduler(adapter);
  });

  it('exposes exactly two slots, morning and evening', () => {
    expect(SLOTS).toEqual(['morning', 'evening']);
  });

  it('schedules a daily slot', async () => {
    await scheduler.enable('morning', { hour: 7, minute: 30, line: 'Morning.', sound: false });
    expect(adapter.scheduled.get('morning')).toMatchObject({ hour: 7, minute: 30 });
  });

  it('rejects unknown slots at runtime, not just in types', async () => {
    await expect(
      scheduler.enable('midday' as NotificationSlot, { hour: 12, minute: 0, line: 'x', sound: false }),
    ).rejects.toThrow(/INV-4/);
  });

  it('rejects invalid times', async () => {
    await expect(
      scheduler.enable('morning', { hour: 24, minute: 0, line: 'x', sound: false }),
    ).rejects.toThrow(/Invalid schedule time/);
  });

  it('disables each slot independently (INV-4)', async () => {
    await scheduler.enable('morning', { hour: 7, minute: 30, line: 'a', sound: false });
    await scheduler.enable('evening', { hour: 21, minute: 30, line: 'b', sound: false });
    await scheduler.disable('morning');
    expect(adapter.scheduled.has('morning')).toBe(false);
    expect(adapter.scheduled.has('evening')).toBe(true);
  });

  it('cancelAll clears both slots (for eraseAll / the Quiet)', async () => {
    await scheduler.enable('morning', { hour: 7, minute: 30, line: 'a', sound: false });
    await scheduler.enable('evening', { hour: 21, minute: 30, line: 'b', sound: false });
    await scheduler.cancelAll();
    expect(adapter.scheduled.size).toBe(0);
  });
});
