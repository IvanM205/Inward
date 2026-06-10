/**
 * The notification scheduler — the ONLY door to notification APIs in Inward.
 *
 * INV-4 / NTF-01 / NFR-A2: the product can schedule exactly two local daily
 * notifications — the morning line and the evening line. Silent by default,
 * neutral copy, each independently disableable. There is no API here to add a
 * third, and ci/covenant/notification-gate.mjs fails the build if any other
 * module touches a platform notification API.
 */

export const SLOTS = ['morning', 'evening'] as const;
export type NotificationSlot = (typeof SLOTS)[number];

export interface SlotSchedule {
  /** Local hour 0–23 (user-chosen; defaults 07:30 / 21:30 per THR-02/03). */
  hour: number;
  minute: number;
  /**
   * The one line shown. Comes from the content bundle's `persuasion/` strings
   * (NFR-P5) — neutral, no deltas, no urgency.
   */
  line: string;
  /** The single optional struck-bowl tone (06 §Sound). Silent by default. */
  sound: boolean;
}

/**
 * Platform adapter implemented over the OS local-notification API (M1).
 * It deals only in slots, so the two-slot limit holds at the bridge too.
 */
export interface NotificationAdapter {
  scheduleDaily(slot: NotificationSlot, schedule: SlotSchedule): Promise<void>;
  cancel(slot: NotificationSlot): Promise<void>;
}

export class NotificationScheduler {
  constructor(private readonly adapter: NotificationAdapter) {}

  async enable(slot: NotificationSlot, schedule: SlotSchedule): Promise<void> {
    assertValidSlot(slot);
    assertValidTime(schedule);
    await this.adapter.scheduleDaily(slot, { ...schedule });
  }

  /** Each notification is individually disableable (INV-4). */
  async disable(slot: NotificationSlot): Promise<void> {
    assertValidSlot(slot);
    await this.adapter.cancel(slot);
  }

  /** Called by storage.eraseAll() (INV-6) and by the Quiet. */
  async cancelAll(): Promise<void> {
    for (const slot of SLOTS) {
      await this.adapter.cancel(slot);
    }
  }
}

function assertValidSlot(slot: string): asserts slot is NotificationSlot {
  if (!SLOTS.includes(slot as NotificationSlot)) {
    throw new Error(`Unknown notification slot "${slot}" — only ${SLOTS.join(', ')} exist (INV-4).`);
  }
}

function assertValidTime({ hour, minute }: SlotSchedule): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`Invalid schedule time ${hour}:${minute}.`);
  }
}
