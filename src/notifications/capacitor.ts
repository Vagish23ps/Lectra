import {
  LocalNotifications,
  Weekday,
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
} from "@capacitor/local-notifications";
import { LectraNotification } from "./notificationTypes";
import { handleNotificationClick } from "./actions";
import { getNotificationNativeId } from "./ids";
import { recordNotificationToHistory } from "./history";
import { useNotificationStore } from "@/store/notificationStore";
import { useEntryStore } from "@/store/entryStore";
import { Entry } from "@/types/entry";

export interface RecurringNotificationSettings {
  weeklySummaryTime: string;   // "HH:MM"
  weeklySummaryDay: string;    // JS convention: "0"=Sun … "6"=Sat
}

export async function registerCapacitorActionTypes() {
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: "TASK_ACTIONS",
          actions: [
            {
              id: "complete",
              title: "Complete",
            },
            {
              id: "view",
              title: "View",
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Error registering notification action types:", error);
  }
}

export async function scheduleCapacitorNotification(
  notification: LectraNotification,
  nativeId: number,
) {
  const isTaskNotification =
    notification.type === "deadline-today" ||
    notification.type === "deadline-tomorrow" ||
    notification.type === "overdue";

  await LocalNotifications.schedule({
    notifications: [
      {
        id: nativeId,
        title: notification.title,
        body: notification.body,
        channelId: "lectra-general",
        actionTypeId: isTaskNotification ? "TASK_ACTIONS" : undefined,
        schedule: {
          at: new Date(notification.scheduledAt),
          allowWhileIdle: true,
        },
        extra: notification,
      },
    ],
  });
}

export async function cancelCapacitorNotification(nativeId: number) {
  await LocalNotifications.cancel({
    notifications: [
      {
        id: nativeId,
      },
    ],
  });
}

export async function cancelCapacitorNotifications(nativeIds: number[]) {
  if (nativeIds.length === 0) return;

  await LocalNotifications.cancel({
    notifications: nativeIds.map((id) => ({
      id,
    })),
  });
}

export async function scheduleRepeatingCapacitorNotification(
  notification: LectraNotification,
  nativeId: number,
  every: "day" | "week",
) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: nativeId,
        title: notification.title,
        body: notification.body,
        channelId: "lectra-general",
        schedule: {
          at: new Date(notification.scheduledAt),
          repeats: true,
          every,
          allowWhileIdle: true,
        },
        extra: notification,
      },
    ],
  });
}

export function computeNotificationFingerprint(
  notification: LectraNotification,
  schedule: LocalNotificationSchema["schedule"],
  channelId?: string,
  actionTypeId?: string,
): string {
  let scheduleKey = "";
  if (schedule) {
    if (schedule.at) {
      const atTime =
        schedule.at instanceof Date
          ? schedule.at.getTime()
          : new Date(schedule.at).getTime();
      scheduleKey = `at:${atTime}:rep:${!!schedule.repeats}:ev:${schedule.every || ""}:idle:${!!schedule.allowWhileIdle}`;
    } else if (schedule.on) {
      scheduleKey = `on:wd:${schedule.on.weekday ?? ""}:h:${schedule.on.hour ?? ""}:m:${schedule.on.minute ?? ""}:idle:${!!schedule.allowWhileIdle}`;
    } else if (schedule.every) {
      scheduleKey = `ev:${schedule.every}:idle:${!!schedule.allowWhileIdle}`;
    }
  }

  const reminder = notification.customReminder;
  const reminderKey = reminder
    ? `${reminder.type}:${reminder.time || ""}:${reminder.date || ""}:${reminder.snoozedUntil || ""}:${reminder.skipNextDate || ""}:${reminder.enabled !== false}`
    : "";

  return [
    notification.id,
    notification.title,
    notification.body,
    channelId || "",
    actionTypeId || "",
    scheduleKey,
    reminderKey,
    notification.entryId || "",
    notification.workId || "",
  ].join("||");
}

export function buildCapacitorNotificationSchema(
  notification: LectraNotification,
  settings: RecurringNotificationSettings,
): LocalNotificationSchema {
  const nativeId = getNotificationNativeId(notification.id);
  const isTaskNotification =
    notification.type === "deadline-today" ||
    notification.type === "deadline-tomorrow" ||
    notification.type === "overdue";

  let actionTypeId: string | undefined = isTaskNotification ? "TASK_ACTIONS" : undefined;
  const channelId = "lectra-general";
  let schedule: LocalNotificationSchema["schedule"] = {
    at: new Date(notification.scheduledAt),
    allowWhileIdle: true,
  };

  if (notification.type === "weekly-summary") {
    actionTypeId = undefined;
    const [hourStr, minuteStr] = settings.weeklySummaryTime.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const jsWeekday = parseInt(settings.weeklySummaryDay, 10);
    const capacitorWeekday = ((jsWeekday % 7) + 1) as Weekday;

    schedule = {
      on: {
        weekday: capacitorWeekday,
        hour,
        minute,
      },
      // Weekly summary is a broad non-urgent check-in: use standard scheduling without forcing Doze wake lock
      allowWhileIdle: false,
    };
  } else if (notification.type === "custom-reminder") {
    const reminder = notification.customReminder;
    const isTask = !!notification.workId;
    actionTypeId = isTask ? "TASK_ACTIONS" : undefined;

    if (reminder?.type === "recurring") {
      const frequency = reminder.recurrence?.frequency || "daily";

      if (frequency === "daily") {
        const [hourStr, minuteStr] = (reminder.time || "09:00").split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        schedule = {
          on: {
            hour,
            minute,
          },
          allowWhileIdle: true,
        };
      } else if (frequency === "weekly" || frequency === "selected-days") {
        const jsWeekday = new Date(notification.scheduledAt).getDay();
        const capacitorWeekday = ((jsWeekday % 7) + 1) as Weekday;
        const [hourStr, minuteStr] = (reminder.time || "09:00").split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        schedule = {
          on: {
            weekday: capacitorWeekday,
            hour,
            minute,
          },
          allowWhileIdle: true,
        };
      } else if (frequency === "monthly") {
        schedule = {
          at: new Date(notification.scheduledAt),
          repeats: true,
          every: "month",
          allowWhileIdle: true,
        };
      }
    } else {
      // One-time custom reminder
      schedule = {
        at: new Date(notification.scheduledAt),
        allowWhileIdle: true,
      };
    }
  }

  const fingerprint = computeNotificationFingerprint(
    notification,
    schedule,
    channelId,
    actionTypeId,
  );

  return {
    id: nativeId,
    title: notification.title,
    body: notification.body,
    channelId,
    actionTypeId,
    schedule,
    extra: {
      ...notification,
      _fingerprint: fingerprint,
    },
  };
}

function isPendingNotificationIdentical(
  pending: PendingLocalNotificationSchema,
  desired: LocalNotificationSchema,
): boolean {
  const desiredFingerprint = (desired.extra as Record<string, unknown> | undefined)?._fingerprint;
  const pendingFingerprint = (pending.extra as Record<string, unknown> | undefined)?._fingerprint;

  if (desiredFingerprint && pendingFingerprint) {
    return desiredFingerprint === pendingFingerprint;
  }

  // Fallback field-by-field comparison for notifications scheduled without _fingerprint
  if (pending.id !== desired.id) return false;
  if (pending.title !== desired.title) return false;
  if (pending.body !== desired.body) return false;

  const pendingSchedule = pending.schedule;
  const desiredSchedule = desired.schedule;

  if (!!pendingSchedule !== !!desiredSchedule) return false;

  if (pendingSchedule && desiredSchedule) {
    if (desiredSchedule.at) {
      if (!pendingSchedule.at) return false;
      const desiredAt =
        desiredSchedule.at instanceof Date
          ? desiredSchedule.at.getTime()
          : new Date(desiredSchedule.at).getTime();
      const pendingAt =
        pendingSchedule.at instanceof Date
          ? pendingSchedule.at.getTime()
          : new Date(pendingSchedule.at).getTime();

      // Allow 1 second tolerance for round-trip Date serialization
      if (Math.abs(desiredAt - pendingAt) > 1000) return false;
      if (!!desiredSchedule.repeats !== !!pendingSchedule.repeats) return false;
      if (desiredSchedule.every !== pendingSchedule.every) return false;
    } else if (desiredSchedule.on) {
      if (!pendingSchedule.on) return false;
      if (desiredSchedule.on.weekday !== pendingSchedule.on.weekday) return false;
      if (desiredSchedule.on.hour !== pendingSchedule.on.hour) return false;
      if (desiredSchedule.on.minute !== pendingSchedule.on.minute) return false;
    } else if (desiredSchedule.every) {
      if (desiredSchedule.every !== pendingSchedule.every) return false;
    }
  }

  const pendingExtra = pending.extra as LectraNotification | undefined;
  const desiredExtra = desired.extra as LectraNotification | undefined;
  if (pendingExtra?.id !== desiredExtra?.id) return false;
  if (pendingExtra?.type !== desiredExtra?.type) return false;
  if (pendingExtra?.workId !== desiredExtra?.workId) return false;
  if (pendingExtra?.entryId !== desiredExtra?.entryId) return false;

  return true;
}

export async function reconcileCapacitorNotifications(
  notifications: LectraNotification[],
  settings: RecurringNotificationSettings,
) {
  const pendingResult = await LocalNotifications.getPending();
  const pendingList = pendingResult.notifications || [];

  // Map existing pending notifications by native id
  const pendingMap = new Map<number, PendingLocalNotificationSchema>();
  for (const pending of pendingList) {
    if (typeof pending.id === "number") {
      pendingMap.set(pending.id, pending);
    }
  }

  // Build desired notifications with deterministic fingerprints
  const desiredSchemas = notifications.map((notification) =>
    buildCapacitorNotificationSchema(notification, settings),
  );

  const desiredIds = new Set<number>();
  const toSchedule: LocalNotificationSchema[] = [];
  const toCancelIds: number[] = [];

  for (const desired of desiredSchemas) {
    desiredIds.add(desired.id);
    const existing = pendingMap.get(desired.id);

    if (!existing) {
      // Genuinely new notification -> schedule
      toSchedule.push(desired);
    } else {
      // Notification exists with same native id -> check if schedule or content changed
      const isIdentical = isPendingNotificationIdentical(existing, desired);
      if (!isIdentical) {
        toCancelIds.push(desired.id);
        toSchedule.push(desired);
      }
      // If identical, leave untouched in AlarmManager!
    }
  }

  // Cancel any stale pending notifications that are no longer part of desired set
  for (const [pendingId, pending] of pendingMap.entries()) {
    const extra = pending.extra as LectraNotification | undefined;
    if (extra?.id && !desiredIds.has(pendingId)) {
      toCancelIds.push(pendingId);
    }
  }

  // 1. Batch cancel stale / changed notifications in one bridge call
  if (toCancelIds.length > 0) {
    await cancelCapacitorNotifications(toCancelIds);
    await LocalNotifications.removeDeliveredNotifications({
      notifications: toCancelIds.map((id) => ({ id, title: "", body: "" })),
    }).catch(() => {});
  }

  // 2. Batch schedule new / changed notifications in one bridge call
  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({
      notifications: toSchedule,
    });
  }
}

export async function handleCompleteNotificationAction(notification: LectraNotification) {
  const { entries, updateEntry } = useEntryStore.getState();
  const rawWorkId =
    notification.workId ||
    notification.id.replace(/^(overdue|deadline-today|deadline-tomorrow|custom-task|custom-task-daily|custom-task-weekly|custom-task-day|custom-task-monthly)-/, "").split("-")[0];

  for (const entry of entries) {
    const work = entry.works.find((w) => w.id === rawWorkId);
    if (work) {
      const updatedEntry: Entry = {
        ...entry,
        works: entry.works.map((w) =>
          w.id === rawWorkId ? { ...w, completed: true } : w,
        ),
      };
      updateEntry(updatedEntry);
      break;
    }
  }

  // Remove delivered notification from Android status bar / tray immediately
  const nativeId = getNotificationNativeId(notification.id);
  await LocalNotifications.removeDeliveredNotifications({
    notifications: [{ id: nativeId, title: "", body: "" }],
  }).catch(() => {});

  // Mark read in notification history store
  useNotificationStore.getState().markAsRead(notification.id);
}

let isSyncingHistory = false;
let lastSyncTimestamp = 0;

export async function syncDeliveredNotificationsToHistory() {
  const now = Date.now();
  // Throttle duplicate calls within 1500ms and prevent concurrent sync executions
  if (isSyncingHistory || now - lastSyncTimestamp < 1500) {
    return;
  }

  isSyncingHistory = true;
  lastSyncTimestamp = now;

  try {
    const delivered = await LocalNotifications.getDeliveredNotifications();
    if (delivered?.notifications?.length) {
      for (const notif of delivered.notifications) {
        recordNotificationToHistory(notif);
      }
    }
  } catch (error) {
    console.error("Error syncing delivered notifications to history:", error);
  } finally {
    isSyncingHistory = false;
  }
}

let capacitorActionsInitialized = false;

export async function initializeCapacitorNotificationActions() {
  if (capacitorActionsInitialized) {
    return;
  }
  capacitorActionsInitialized = true;

  await registerCapacitorActionTypes();

  await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      const extra = event.notification.extra as LectraNotification | undefined;
      recordNotificationToHistory(event.notification, true);

      if (event.actionId === "complete" && extra) {
        void handleCompleteNotificationAction(extra);
      } else {
        if (extra) {
          handleNotificationClick(extra);
        }
      }
    },
  );

  await LocalNotifications.addListener(
    "localNotificationReceived",
    (notification) => {
      recordNotificationToHistory(notification);
    },
  );

  // Sync delivered notifications on startup
  await syncDeliveredNotificationsToHistory();

  // Re-sync when app returns to foreground (throttled guard prevents duplicate concurrent executions)
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void syncDeliveredNotificationsToHistory();
      }
    });
  }

  if (typeof window !== "undefined") {
    window.addEventListener("focus", () => {
      void syncDeliveredNotificationsToHistory();
    });
  }
}
