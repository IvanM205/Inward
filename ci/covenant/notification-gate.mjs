// NFR-A2 / INV-4 / NTF-01 — notification scheduling is allowed ONLY inside
// src/core/notifications/ (and its future native counterparts, listed below).
// Any other call site that touches a notification API fails CI, so the 2-slot
// scheduler module is physically the only door.
import { walkSourceFiles, relPath, readLines, report } from './lib.mjs';

const NOTIFICATION_APIS = [
  /notifee/i,
  /react-native-push-notification/i,
  /PushNotificationIOS/,
  /expo-notifications/i,
  /UNUserNotificationCenter/,
  /UNNotificationRequest/,
  /AlarmManager/,
  /NotificationCompat/,
  /NotificationManager/,
  /setExactAndAllowWhileIdle/,
  /scheduleLocalNotification/i,
];

const ALLOWED_PREFIXES = [
  'src/core/notifications/',
  // Native bridge homes for the scheduler (M1) — nothing else:
  'android/app/src/main/java/com/inward/notifications/',
  'ios/Inward/Notifications/',
];

const violations = [];
for (const file of walkSourceFiles()) {
  const rel = relPath(file);
  if (ALLOWED_PREFIXES.some((p) => rel.startsWith(p))) continue;
  readLines(file).forEach((line, i) => {
    for (const api of NOTIFICATION_APIS) {
      if (api.test(line)) {
        violations.push(`${rel}:${i + 1} touches notification API ${api} outside core/notifications`);
      }
    }
  });
}

process.exitCode = report('notification-gate (NFR-A2)', violations) ? 1 : 0;
