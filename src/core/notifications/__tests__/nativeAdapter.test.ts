import { NativeModules } from 'react-native';
import { nativeNotificationAdapter } from '../nativeAdapter';
import { NotificationScheduler } from '../scheduler';

const SCHEDULE = { hour: 7, minute: 30, line: 'The morning compass is open.', sound: false };

afterEach(() => {
  delete (NativeModules as Record<string, unknown>).InwardNotifications;
});

describe('nativeNotificationAdapter (NTF-01)', () => {
  it('is a silent no-op when the native bridge is absent — never more, only fewer', async () => {
    await expect(nativeNotificationAdapter.scheduleDaily('morning', SCHEDULE)).resolves.toBeUndefined();
    await expect(nativeNotificationAdapter.cancel('evening')).resolves.toBeUndefined();
  });

  it('passes the two slots through to the bridge when present', async () => {
    const scheduleDaily = jest.fn().mockResolvedValue(undefined);
    const cancel = jest.fn().mockResolvedValue(undefined);
    (NativeModules as Record<string, unknown>).InwardNotifications = { scheduleDaily, cancel };

    const scheduler = new NotificationScheduler(nativeNotificationAdapter);
    await scheduler.enable('morning', SCHEDULE);
    expect(scheduleDaily).toHaveBeenCalledWith('morning', 7, 30, SCHEDULE.line, false);

    await scheduler.disable('morning');
    expect(cancel).toHaveBeenCalledWith('morning');

    await scheduler.cancelAll();
    expect(cancel).toHaveBeenCalledWith('evening'); // both slots, nothing else exists
  });
});
