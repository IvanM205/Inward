/**
 * Composition root: the one place the production adapters meet. Everything
 * downstream receives ports, so Jest exercises the same code over fakes.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { nativeNotificationAdapter } from '../core/notifications/nativeAdapter';
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

export const scheduler = new NotificationScheduler(nativeNotificationAdapter);

export const storage = new Storage({
  databaseProvider: opSqliteProvider,
  keyStore: keychainKeyStore,
  widgets: noWidgetsYet,
  notifications: scheduler,
});

/**
 * The honest permission asks (ONB-03). Android 13+ has a runtime dialog for
 * notifications; older Android and iOS grant when the slots are first
 * enabled through the native scheduler bridge. Screen-time access waits for
 * the DeviceActivity/UsageStats bridges — refusal (or absence) degrades
 * nothing but that signal.
 */
export const permissionRequests: PermissionRequests = {
  async requestNotifications(): Promise<boolean> {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  },
  async requestScreenTime(): Promise<boolean> {
    return false;
  },
};
