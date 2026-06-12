package com.inward.notifications

// NTF-01 / INV-4 — the Android half of the two-slot scheduler. This file
// lives in the ONLY Android path the covenant notification-gate allows
// (ci/covenant/notification-gate.mjs). It deals strictly in the two named
// slots; there is no API here to schedule anything else.
//
// NOTE: written ahead of device testing — verify on hardware before release
// (exact alarms need no permission because we use inexact daily repeats,
// which is correct here: the line is quiet, the minute does not matter).

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Calendar

private const val SLOT_MORNING = "morning"
private const val SLOT_EVENING = "evening"
private const val CHANNEL_SILENT = "inward.compass.silent"
private const val CHANNEL_BOWL = "inward.compass.bowl"

private fun requestCode(slot: String) = if (slot == SLOT_MORNING) 1 else 2

class InwardNotificationsModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    override fun getName() = "InwardNotifications"

    private fun ensureChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        // Silent by default (INV-4); the single optional struck-bowl tone is
        // its own channel so the user's choice maps to OS settings honestly.
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_SILENT, "Compass lines", NotificationManager.IMPORTANCE_LOW)
        )
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_BOWL, "Compass lines (with tone)", NotificationManager.IMPORTANCE_DEFAULT)
        )
    }

    private fun pendingIntent(slot: String, line: String?, sound: Boolean): PendingIntent {
        val intent = Intent(context, CompassLineReceiver::class.java).apply {
            putExtra("slot", slot)
            putExtra("line", line ?: "")
            putExtra("sound", sound)
        }
        return PendingIntent.getBroadcast(
            context,
            requestCode(slot),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    @ReactMethod
    fun scheduleDaily(slot: String, hour: Int, minute: Int, line: String, sound: Boolean, promise: Promise) {
        if (slot != SLOT_MORNING && slot != SLOT_EVENING) {
            promise.reject("INV4", "Unknown slot: $slot")
            return
        }
        ensureChannels()
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val at = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
        }
        // Inexact daily repeat: battery-kind (NFR-F3) and minute-precision is
        // not a goal for a quiet line.
        alarmManager.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            at.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            pendingIntent(slot, line, sound)
        )
        promise.resolve(null)
    }

    @ReactMethod
    fun cancel(slot: String, promise: Promise) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntent(slot, null, false))
        promise.resolve(null)
    }
}

class CompassLineReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val slot = intent.getStringExtra("slot") ?: return
        val line = intent.getStringExtra("line") ?: return
        val sound = intent.getBooleanExtra("sound", false)
        val channel = if (sound) CHANNEL_BOWL else CHANNEL_SILENT
        val notification = NotificationCompat.Builder(context, channel)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentText(line) // neutral copy only — no deltas, no urgency (NTF-01)
            .setAutoCancel(true)
            .setShowWhen(false)
            .setNumber(0) // never a count, never a red dot of our making (INV-2)
            .build()
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.notify(requestCode(slot), notification)
    }
}
