import {
  LocalNotifications,
  Weekday,
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
} from "@capacitor/local-notifications";
import { LectraNotification } from "./notificationTypes";
import { handleNotificationActionRouting } from "./actions";
import { getNotificationNativeId } from "./ids";
import { recordNotificationToHistory } from "./history";
import { saveNotificationRegistry, findNotificationMetadata } from "./registry";
import { useNotificationStore } from "@/store/notificationStore";
import { useEntryStore } from "@/store/entryStore";
import {
  useNotificationSettingsStore,
  NotificationSettings,
} from "@/store/notificationSettingsStore";
import { Entry } from "@/types/entry";
import { CustomReminder } from "@/types/reminder";
import { format } from "date-fns";
import { createScheduledDate } from "./engine";

export interface RecurringNotificationSettings {
  weeklySummaryTime: string; // "HH:MM"
  weeklySummaryDay: string; // JS convention: "0"=Sun … "6"=Sat
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
              id: "remind",
              title: "Remind me",
            },
          ],
        },
        {
          id: "REMINDER_ACTIONS",
          actions: [
            {
              id: "remind",
              title: "Remind me",
            },
            {
              id: "stop",
              title: "Stop",
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

  const actionTypeId = isTaskNotification
    ? "TASK_ACTIONS"
    : notification.type === "custom-reminder"
      ? "REMINDER_ACTIONS"
      : undefined;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: nativeId,
        title: notification.title,
        body: notification.body,
        channelId: "lectra-general",
        actionTypeId,
        schedule: {
          at: new Date(notification.scheduledAt),
          allowWhileIdle: true,
        },
        extra: {
          ...notification,
          notificationId: notification.id,
          entryId: notification.entryId,
          workId: notification.workId,
          reminderId: notification.customReminder?.id,
          notificationCategory: isTaskNotification ? "task" : "active-reminder",
        },
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
      scheduleKey = `on:wd:${schedule.on.weekday ?? ""}:h:${schedule.on.hour ?? ""}:m:${schedule.on.minute ?? ""}:s:${schedule.on.second ?? ""}:idle:${!!schedule.allowWhileIdle}`;
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

  let actionTypeId: string | undefined = isTaskNotification
    ? "TASK_ACTIONS"
    : undefined;
  const channelId = isTaskNotification
    ? "lectra-deadlines"
    : notification.type === "custom-reminder"
      ? "lectra-reminders"
      : "lectra-general";
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
      allowWhileIdle: false,
    };
  } else if (notification.type === "custom-reminder") {
    actionTypeId = "REMINDER_ACTIONS";
    const reminder = notification.customReminder;
    const isSnoozedOccurrence = notification.id.includes("-snoozed-");

    if (isSnoozedOccurrence) {
      // Snoozed occurrence: ALWAYS schedule as an exact one-time alarm at scheduledAt
      schedule = {
        at: new Date(notification.scheduledAt),
        allowWhileIdle: true,
      };
    } else if (reminder?.type === "recurring") {
      const frequency = reminder.recurrence?.frequency || "daily";

      if (frequency === "daily") {
        const [hourStr, minuteStr] = (reminder.time || "09:00").split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        schedule = {
          on: {
            hour,
            minute,
            second: 0,
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
            second: 0,
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
      notificationId: notification.id,
      entryId: notification.entryId,
      workId: notification.workId,
      reminderId: notification.customReminder?.id,
      notificationCategory: isTaskNotification ? "task" : "active-reminder",
      isSnoozed: notification.id.includes("-snoozed-"),
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

      if (Math.abs(desiredAt - pendingAt) > 1000) return false;
      if (!!desiredSchedule.repeats !== !!pendingSchedule.repeats) return false;
      if (desiredSchedule.every !== pendingSchedule.every) return false;
    } else if (desiredSchedule.on) {
      if (!pendingSchedule.on) return false;
      const dW = desiredSchedule.on.weekday ?? null;
      const pW = pendingSchedule.on.weekday ?? null;
      if (dW !== pW) return false;
      const dH = desiredSchedule.on.hour ?? null;
      const pH = pendingSchedule.on.hour ?? null;
      if (dH !== pH) return false;
      const dM = desiredSchedule.on.minute ?? null;
      const pM = pendingSchedule.on.minute ?? null;
      if (dM !== pM) return false;
      const dS = desiredSchedule.on.second ?? null;
      const pS = pendingSchedule.on.second ?? null;
      if (dS !== pS) return false;
    } else if (desiredSchedule.every) {
      if (desiredSchedule.every !== pendingSchedule.every) return false;
    }
  }

  const pendingExtra = pending.extra as LectraNotification | undefined;
  const desiredExtra = desired.extra as LectraNotification | undefined;
  if (pendingExtra && desiredExtra) {
    if (pendingExtra.id !== desiredExtra.id) return false;
    if (pendingExtra.type !== desiredExtra.type) return false;
    if (pendingExtra.workId !== desiredExtra.workId) return false;
    if (pendingExtra.entryId !== desiredExtra.entryId) return false;
  }

  return true;
}

function isPendingOneTimeNotificationStillValid(
  pendingId: number,
  pending: PendingLocalNotificationSchema,
  entries: Entry[],
  settings: NotificationSettings,
): boolean {
  if (!settings.enabled) {
    return false;
  }

  const extra = pending.extra as Record<string, unknown> | undefined;
  const registryMeta = findNotificationMetadata(pendingId, pending.title, pending.body);

  const stringId = String(extra?.notificationId ?? extra?.id ?? registryMeta?.id ?? "");
  const type = String(extra?.type ?? registryMeta?.type ?? "");
  const entryId = (extra?.entryId ?? registryMeta?.entryId) as string | undefined;
  const workId = (extra?.workId ?? registryMeta?.workId) as string | undefined;
  const reminderId = (extra?.reminderId ?? (extra?.customReminder as CustomReminder | undefined)?.id ?? registryMeta?.reminderId) as string | undefined;

  const isSnoozed = stringId.includes("-snoozed-") || Boolean(extra?.isSnoozed);
  const isTaskDeadline =
    type === "deadline-today" ||
    type === "deadline-tomorrow" ||
    type === "overdue" ||
    stringId.startsWith("deadline-today-") ||
    stringId.startsWith("deadline-tomorrow-") ||
    stringId.startsWith("overdue-");

  const isOneTimeCustom =
    (type === "custom-reminder" &&
      !stringId.includes("-daily-") &&
      !stringId.includes("-weekly-") &&
      !stringId.includes("-day-") &&
      !stringId.includes("-monthly-")) ||
    isSnoozed;

  const isOneTime =
    isTaskDeadline ||
    isOneTimeCustom ||
    (Boolean(pending.schedule?.at) &&
      !pending.schedule?.repeats &&
      !pending.schedule?.on &&
      !pending.schedule?.every);

  // Recurring notifications never disappear from desiredIds merely due to time passage.
  // Their absence from desiredIds means they were genuinely deleted, disabled, or completed.
  if (!isOneTime) {
    return false;
  }

  // Resolve scheduled timestamp if available
  let scheduledTimestamp: number | undefined;
  if (typeof extra?.scheduledAt === "number") {
    scheduledTimestamp = extra.scheduledAt;
  } else if (pending.schedule?.at) {
    scheduledTimestamp =
      pending.schedule.at instanceof Date
        ? pending.schedule.at.getTime()
        : new Date(pending.schedule.at).getTime();
  }

  // A one-time notification whose scheduled timestamp has already passed MUST NOT remain scheduled.
  // If not fired yet, it is stale and must be cancelled rather than firing as a delayed alarm later.
  if (
    scheduledTimestamp !== undefined &&
    !isNaN(scheduledTimestamp) &&
    scheduledTimestamp <= Date.now()
  ) {
    return false;
  }

  // 1. Task Deadline Notifications
  if (isTaskDeadline) {
    if (
      (type === "deadline-today" || stringId.startsWith("deadline-today-")) &&
      !(settings.dueTodayReminder ?? settings.dueTodayEnabled ?? true)
    ) {
      return false;
    }
    if (
      (type === "deadline-tomorrow" || stringId.startsWith("deadline-tomorrow-")) &&
      !(settings.dueTomorrowReminder ?? settings.dueTomorrowEnabled ?? true)
    ) {
      return false;
    }
    if (
      (type === "overdue" || stringId.startsWith("overdue-")) &&
      !(settings.overdueReminder ?? settings.overdueEnabled ?? true)
    ) {
      return false;
    }

    const effectiveWorkId =
      workId ||
      stringId
        .replace(/^(overdue|deadline-today|deadline-tomorrow)-/, "")
        .split("-")[0];

    if (!effectiveWorkId) return false;

    let targetEntry: Entry | undefined = entryId
      ? entries.find((e) => e.id === entryId)
      : undefined;
    let targetWork = targetEntry?.works.find((w) => w.id === effectiveWorkId);

    if (!targetWork) {
      for (const e of entries) {
        const found = e.works.find((w) => w.id === effectiveWorkId);
        if (found) {
          targetEntry = e;
          targetWork = found;
          break;
        }
      }
    }

    if (!targetEntry || !targetWork) return false;
    if (targetWork.completed) return false;
    if (!targetWork.addToPending) return false;
    if (!targetWork.deadline) return false;

    // Check if the deadline date OR the configured alert time was modified
    if (scheduledTimestamp && !isNaN(scheduledTimestamp)) {
      if (type === "deadline-today" || stringId.startsWith("deadline-today-")) {
        const expectedScheduledAt = createScheduledDate(
          targetWork.deadline,
          settings.dueTodayReminderTime || "08:00",
          0
        ).getTime();
        if (Math.abs(expectedScheduledAt - scheduledTimestamp) > 1000) {
          return false;
        }
      } else if (type === "deadline-tomorrow" || stringId.startsWith("deadline-tomorrow-")) {
        const expectedScheduledAt = createScheduledDate(
          targetWork.deadline,
          settings.dueTomorrowReminderTime || "17:00",
          -1
        ).getTime();
        if (Math.abs(expectedScheduledAt - scheduledTimestamp) > 1000) {
          return false;
        }
      } else if (type === "overdue" || stringId.startsWith("overdue-")) {
        const expectedScheduledAt = createScheduledDate(
          targetWork.deadline,
          settings.overdueReminderTime || "07:30",
          1
        ).getTime();
        if (Math.abs(expectedScheduledAt - scheduledTimestamp) > 1000) {
          return false;
        }
      }
    }

    return true;
  }

  // 2. Custom Reminders (Task or Entry, including snoozed)
  const isCustomRemindersEnabled =
    settings.customReminders ?? settings.customRemindersEnabled ?? true;
  if (!isCustomRemindersEnabled) return false;

  const isTaskReminder =
    Boolean(workId) ||
    stringId.startsWith("custom-task-") ||
    stringId.startsWith("custom-task");

  if (isTaskReminder) {
    const effectiveWorkId =
      workId ||
      stringId
        .replace(/^custom-task-(snoozed-)?/, "")
        .split("-")[0];

    if (!effectiveWorkId) return false;

    let targetEntry: Entry | undefined = entryId
      ? entries.find((e) => e.id === entryId)
      : undefined;
    let targetWork = targetEntry?.works.find((w) => w.id === effectiveWorkId);

    if (!targetWork) {
      for (const e of entries) {
        const found = e.works.find((w) => w.id === effectiveWorkId);
        if (found) {
          targetEntry = e;
          targetWork = found;
          break;
        }
      }
    }

    if (!targetEntry || !targetWork) return false;
    if (targetWork.completed) return false;
    if (!targetWork.reminder || targetWork.reminder.enabled === false) return false;
    if (reminderId && targetWork.reminder.id !== reminderId) return false;

    if (isSnoozed) {
      if (!targetWork.reminder.snoozedUntil) return false;
      if (scheduledTimestamp && !isNaN(scheduledTimestamp)) {
        const currentSnoozeTime = new Date(targetWork.reminder.snoozedUntil).getTime();
        if (Math.abs(currentSnoozeTime - scheduledTimestamp) > 1000) {
          return false;
        }
      }
    } else if (targetWork.reminder.type === "one-time") {
      if (!targetWork.reminder.date) return false;
      if (scheduledTimestamp && !isNaN(scheduledTimestamp)) {
        const scheduledDateStr = format(new Date(scheduledTimestamp), "yyyy-MM-dd");
        if (targetWork.reminder.date !== scheduledDateStr) {
          return false;
        }
        const [rHour, rMinute] = (targetWork.reminder.time || "09:00").split(":").map(Number);
        const [year, month, day] = targetWork.reminder.date.split("-").map(Number);
        const expectedScheduledAt = new Date(year, month - 1, day, rHour, rMinute, 0, 0).getTime();
        if (Math.abs(expectedScheduledAt - scheduledTimestamp) > 1000) {
          return false;
        }
      }
    }

    return true;
  } else {
    // Entry-level reminder
    const effectiveEntryId =
      entryId ||
      stringId
        .replace(/^custom-entry-(snoozed-)?/, "")
        .split("-")[0];

    if (!effectiveEntryId) return false;

    const targetEntry = entries.find((e) => e.id === effectiveEntryId);
    if (!targetEntry) return false;
    if (!targetEntry.reminder || targetEntry.reminder.enabled === false) return false;
    if (reminderId && targetEntry.reminder.id !== reminderId) return false;

    if (isSnoozed) {
      if (!targetEntry.reminder.snoozedUntil) return false;
      if (scheduledTimestamp && !isNaN(scheduledTimestamp)) {
        const currentSnoozeTime = new Date(targetEntry.reminder.snoozedUntil).getTime();
        if (Math.abs(currentSnoozeTime - scheduledTimestamp) > 1000) {
          return false;
        }
      }
    } else if (targetEntry.reminder.type === "one-time") {
      if (!targetEntry.reminder.date) return false;
      if (scheduledTimestamp && !isNaN(scheduledTimestamp)) {
        const scheduledDateStr = format(new Date(scheduledTimestamp), "yyyy-MM-dd");
        if (targetEntry.reminder.date !== scheduledDateStr) {
          return false;
        }
        const [rHour, rMinute] = (targetEntry.reminder.time || "09:00").split(":").map(Number);
        const [year, month, day] = targetEntry.reminder.date.split("-").map(Number);
        const expectedScheduledAt = new Date(year, month - 1, day, rHour, rMinute, 0, 0).getTime();
        if (Math.abs(expectedScheduledAt - scheduledTimestamp) > 1000) {
          return false;
        }
      }
    }

    return true;
  }
}

export async function reconcileCapacitorNotifications(
  notifications: LectraNotification[],
  settings: RecurringNotificationSettings,
  entries?: Entry[],
) {
  // Always update our persistent registry of scheduled notifications
  saveNotificationRegistry(notifications);

  const pendingResult = await LocalNotifications.getPending();
  const pendingList = pendingResult.notifications || [];

  const pendingMap = new Map<number, PendingLocalNotificationSchema>();
  for (const pending of pendingList) {
    if (typeof pending.id === "number") {
      pendingMap.set(pending.id, pending);
    }
  }

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
      toSchedule.push(desired);
    } else {
      const isIdentical = isPendingNotificationIdentical(existing, desired);
      if (!isIdentical) {
        toCancelIds.push(desired.id);
        toSchedule.push(desired);
      }
    }
  }

  const fullSettings = useNotificationSettingsStore.getState();
  const currentEntries =
    entries && entries.length > 0 ? entries : useEntryStore.getState().entries;

  for (const pendingId of pendingMap.keys()) {
    if (!desiredIds.has(pendingId)) {
      const pending = pendingMap.get(pendingId);
      if (
        pending &&
        isPendingOneTimeNotificationStillValid(
          pendingId,
          pending,
          currentEntries,
          fullSettings,
        )
      ) {
        // Pending one-time notification has merely reached/passed its scheduledAt time,
        // but its underlying task/reminder is still valid and not completed/deleted/disabled.
        // DO NOT cancel it, and DO NOT remove it from delivered notifications.
        continue;
      }
      toCancelIds.push(pendingId);
    }
  }

  if (toCancelIds.length > 0) {
    await cancelCapacitorNotifications(toCancelIds);
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({
      notifications: toSchedule,
    });
  }
}

let isSyncingHistory = false;
let lastSyncTimestamp = 0;

export async function syncDeliveredNotificationsToHistory() {
  const now = Date.now();
  if (isSyncingHistory || now - lastSyncTimestamp < 1000) {
    return;
  }

  isSyncingHistory = true;
  lastSyncTimestamp = now;

  try {
    // Ensure the notification store is hydrated from persistent storage before syncing
    const store = useNotificationStore.getState();
    if (!store.hydrated) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

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

  type NotificationPayload = {
    id: number;
    title?: string;
    body?: string;
    extra?: unknown;
  };

  const onActionPerformed = async (event: { actionId: string; notification: NotificationPayload }) => {
    // Record to history as delivered and read
    recordNotificationToHistory(event.notification, true);

    // Route the action (complete / remind / stop / tap)
    await handleNotificationActionRouting(event.actionId, event.notification);
  };

  const onNotificationReceived = (notification: NotificationPayload) => {
    recordNotificationToHistory(notification);
  };

  await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    onActionPerformed,
  );

  await LocalNotifications.addListener(
    "localNotificationReceived",
    onNotificationReceived,
  );

  if (typeof window !== "undefined") {
    (window as unknown as { __LECTRA_ACTIONS_DISPATCH__?: unknown }).__LECTRA_ACTIONS_DISPATCH__ = {
      onActionPerformed,
      onNotificationReceived,
      syncDeliveredNotificationsToHistory,
    };
  }

  // Sync delivered notifications on startup
  await syncDeliveredNotificationsToHistory();

  // Re-sync when app returns to foreground
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
