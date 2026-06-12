// NTF-01 / INV-4 — the iOS half of the two-slot scheduler, in the ONLY iOS
// path the covenant notification-gate allows. Two named slots, nothing else.
// NOTE: written ahead of device testing — verify on hardware before release.

import Foundation
import UserNotifications

@objc(InwardNotifications)
class InwardNotifications: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private func identifier(_ slot: String) -> String { "inward.compass.\(slot)" }

  @objc(scheduleDaily:hour:minute:line:sound:resolver:rejecter:)
  func scheduleDaily(
    _ slot: String,
    hour: NSNumber,
    minute: NSNumber,
    line: String,
    sound: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard slot == "morning" || slot == "evening" else {
      reject("INV4", "Unknown slot: \(slot)", nil)
      return
    }
    let content = UNMutableNotificationContent()
    content.body = line // neutral copy only — no deltas, no urgency (NTF-01)
    // No app-icon count is ever set — no red dots of our making (INV-2).
    if sound {
      content.sound = UNNotificationSound(named: UNNotificationSoundName("struck_bowl.caf"))
    } // silent by default (INV-4)

    var components = DateComponents()
    components.hour = hour.intValue
    components.minute = minute.intValue
    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
    let request = UNNotificationRequest(
      identifier: identifier(slot), content: content, trigger: trigger)

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        reject("SCHEDULE", error.localizedDescription, error)
      } else {
        resolve(nil)
      }
    }
  }

  @objc(cancel:resolver:rejecter:)
  func cancel(
    _ slot: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().removePendingNotificationRequests(
      withIdentifiers: [identifier(slot)])
    resolve(nil)
  }
}
