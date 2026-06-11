/**
 * Composition root: the one place the production adapters meet. Everything
 * downstream receives ports, so Jest exercises the same code over fakes.
 */
import { nullNotificationAdapter } from '../core/notifications/nullAdapter';
import { NotificationScheduler } from '../core/notifications/scheduler';
import { keychainKeyStore } from '../core/storage/keychainKeyStore';
import { opSqliteProvider } from '../core/storage/opSqliteProvider';
import { WidgetSurface } from '../core/storage/ports';
import { Storage } from '../core/storage/Storage';
import { PermissionRequests } from './onboarding/PermissionsScreen';

/** Native widget surfaces ship with the widget work (02 §Platform targets). */
const noWidgetsYet: WidgetSurface = {
  async clearAll(): Promise<void> {},
};

export const scheduler = new NotificationScheduler(nullNotificationAdapter);

export const storage = new Storage({
  databaseProvider: opSqliteProvider,
  keyStore: keychainKeyStore,
  widgets: noWidgetsYet,
  notifications: scheduler,
});

/**
 * OS permission dialogs arrive with the native notification/screen-time
 * bridges. Until then nothing is granted — refusal degrades nothing (ONB-03),
 * so the app is fully usable either way.
 */
export const permissionRequests: PermissionRequests = {
  async requestNotifications(): Promise<boolean> {
    return false;
  },
  async requestScreenTime(): Promise<boolean> {
    return false;
  },
};
