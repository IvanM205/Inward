/**
 * Placeholder NotificationAdapter until the native bridges land
 * (android/.../notifications, ios/Inward/Notifications — see
 * ci/covenant/notification-gate.mjs ALLOWED_PREFIXES). Scheduling through it
 * is a silent no-op, which is covenant-safe: fewer notifications, never more.
 */
import { NotificationAdapter } from './scheduler';

export const nullNotificationAdapter: NotificationAdapter = {
  async scheduleDaily(): Promise<void> {},
  async cancel(): Promise<void> {},
};
