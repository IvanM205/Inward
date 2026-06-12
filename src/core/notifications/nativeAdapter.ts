/**
 * NotificationAdapter over the native two-slot bridges (NTF-01) — Kotlin
 * under android/.../notifications, Swift under ios/Inward/Notifications, the
 * only homes the covenant gate allows. Where the native module is absent
 * (Jest, fresh checkouts before a native build), scheduling is a silent
 * no-op: covenant-safe — fewer notifications, never more.
 */
import { NativeModules } from 'react-native';
import { NotificationAdapter, NotificationSlot, SlotSchedule } from './scheduler';

interface NativeBridge {
  scheduleDaily(
    slot: string,
    hour: number,
    minute: number,
    line: string,
    sound: boolean,
  ): Promise<void>;
  cancel(slot: string): Promise<void>;
}

function bridge(): NativeBridge | null {
  return (NativeModules as { InwardNotifications?: NativeBridge }).InwardNotifications ?? null;
}

export const nativeNotificationAdapter: NotificationAdapter = {
  async scheduleDaily(slot: NotificationSlot, schedule: SlotSchedule): Promise<void> {
    const native = bridge();
    if (!native) return;
    await native.scheduleDaily(slot, schedule.hour, schedule.minute, schedule.line, schedule.sound);
  },
  async cancel(slot: NotificationSlot): Promise<void> {
    const native = bridge();
    if (!native) return;
    await native.cancel(slot);
  },
};
