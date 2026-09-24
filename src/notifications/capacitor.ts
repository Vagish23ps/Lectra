import { LocalNotifications, Weekday } from "@capacitor/local-notifications";
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

export async function reconcileCapacitorNotifications(
  notifications: LectraNotification[],
  settings: RecurringNotificationSettings,
) {
  const pending = await LocalNotifications.getPending();

  const currentIds = new Set(
    notifications.map((notification) =>
      getNotificationNativeId(notification.id),
    ),
  );

  const staleIds: number[] = [];

  for (const pendingNotification of pending.notifications) {
    const extra = pendingNotification.extra as LectraNotification | undefined;

    if (!extra?.id) continue;

    const nativeId = pendingNotification.id;

    if (!currentIds.has(nativeId)) {
      staleIds.push(nativeId);
    }
  }

  if (staleIds.length > 0) {
    await cancelCapacitorNotifications(staleIds);
    await LocalNotifications.removeDeliveredNotifications({
      notifications: staleIds.map((id) => ({ id, title: "", body: "" })),
    }).catch(() => {});
  }

  // Reschedule all active notifications
  for (const notification of notifications) {
    const nativeId = getNotificationNativeId(notification.id);

    // Cancel existing before re-scheduling to ensure exact update
    await cancelCapacitorNotification(nativeId);

    if (notification.type === "weekly-summary") {
      const [hourStr, minuteStr] = settings.weeklySummaryTime.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const jsWeekday = parseInt(settings.weeklySummaryDay, 10);
      // Convert JS Sunday=0..Saturday=6 to Capacitor Sunday=1..Saturday=7
      const capacitorWeekday = ((jsWeekday % 7) + 1) as Weekday;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: nativeId,
            title: notification.title,
            body: notification.body,
            channelId: "lectra-general",
            schedule: {
              on: {
                weekday: capacitorWeekday,
                hour,
                minute,
              },
              allowWhileIdle: true,
            },
            extra: notification,
          },
        ],
      });

      continue;
    }

    if (notification.type === "custom-reminder") {
      const reminder = notification.customReminder;
      const isTask = !!notification.workId;

      if (reminder?.type === "recurring") {
        const frequency = reminder.recurrence?.frequency || "daily";

        if (frequency === "daily") {
          const [hourStr, minuteStr] = (reminder.time || "09:00").split(":");
          const hour = parseInt(hourStr, 10);
          const minute = parseInt(minuteStr, 10);

          await LocalNotifications.schedule({
            notifications: [
              {
                id: nativeId,
                title: notification.title,
                body: notification.body,
                channelId: "lectra-general",
                actionTypeId: isTask ? "TASK_ACTIONS" : undefined,
                schedule: {
                  on: {
                    hour,
                    minute,
                  },
                  allowWhileIdle: true,
                },
                extra: notification,
              },
            ],
          });
          continue;
        }

        if (frequency === "weekly" || frequency === "selected-days") {
          const jsWeekday = new Date(notification.scheduledAt).getDay();
          const capacitorWeekday = ((jsWeekday % 7) + 1) as Weekday;
          const [hourStr, minuteStr] = (reminder.time || "09:00").split(":");
          const hour = parseInt(hourStr, 10);
          const minute = parseInt(minuteStr, 10);

          await LocalNotifications.schedule({
            notifications: [
              {
                id: nativeId,
                title: notification.title,
                body: notification.body,
                channelId: "lectra-general",
                actionTypeId: isTask ? "TASK_ACTIONS" : undefined,
                schedule: {
                  on: {
                    weekday: capacitorWeekday,
                    hour,
                    minute,
                  },
                  allowWhileIdle: true,
                },
                extra: notification,
              },
            ],
          });
          continue;
        }

        if (frequency === "monthly") {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: nativeId,
                title: notification.title,
                body: notification.body,
                channelId: "lectra-general",
                actionTypeId: isTask ? "TASK_ACTIONS" : undefined,
                schedule: {
                  at: new Date(notification.scheduledAt),
                  repeats: true,
                  every: "month",
                  allowWhileIdle: true,
                },
                extra: notification,
              },
            ],
          });
          continue;
        }
      }

      // One-time custom reminder
      await LocalNotifications.schedule({
        notifications: [
          {
            id: nativeId,
            title: notification.title,
            body: notification.body,
            channelId: "lectra-general",
            actionTypeId: isTask ? "TASK_ACTIONS" : undefined,
            schedule: {
              at: new Date(notification.scheduledAt),
              allowWhileIdle: true,
            },
            extra: notification,
          },
        ],
      });
      continue;
    }

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

export async function syncDeliveredNotificationsToHistory() {
  try {
    const delivered = await LocalNotifications.getDeliveredNotifications();
    if (delivered?.notifications?.length) {
      for (const notif of delivered.notifications) {
        recordNotificationToHistory(notif);
      }
    }
  } catch (error) {
    console.error("Error syncing delivered notifications to history:", error);
  }
}

export async function initializeCapacitorNotificationActions() {
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

export async function debugNotificationState() {
  const pending = await LocalNotifications.getPending();
  const delivered = await LocalNotifications.getDeliveredNotifications();
  const history = useNotificationStore.getState().notifications;

  console.log(
    "🚨 NOTIFICATION DEBUG PENDING:",
    JSON.stringify(pending, null, 2),
  );

  console.log(
    "🚨 NOTIFICATION DEBUG DELIVERED:",
    JSON.stringify(delivered, null, 2),
  );

  console.log(
    "🚨 NOTIFICATION DEBUG HISTORY STORE:",
    JSON.stringify(history, null, 2),
  );
}
