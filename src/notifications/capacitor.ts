import { LocalNotifications, Weekday } from "@capacitor/local-notifications";
import { LectraNotification } from "./notificationTypes";
import { handleNotificationClick } from "./actions";
import { getNotificationNativeId } from "./ids";
import { recordNotificationToHistory } from "./history";
import { useNotificationStore } from "@/store/notificationStore";

export interface RecurringNotificationSettings {
  dailyReminderTime: string;   // "HH:MM"
  weeklySummaryTime: string;   // "HH:MM"
  weeklySummaryDay: string;    // JS convention: "0"=Sun … "6"=Sat
}

export async function scheduleCapacitorNotification(
  notification: LectraNotification,
  nativeId: number,
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
    await LocalNotifications.cancel({
      notifications: staleIds.map((id) => ({
        id,
      })),
    });
  }

  for (const notification of notifications) {
    const nativeId = getNotificationNativeId(notification.id);
    console.log("🔔 LECTRA SCHEDULING:", {
      id: notification.id,
      nativeId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      scheduledAt: new Date(notification.scheduledAt).toString(),
    });

    await LocalNotifications.cancel({
      notifications: [
        {
          id: nativeId,
        },
      ],
    });

    if (notification.type === "daily-reminder") {
      const [drHour, drMinute] = settings.dailyReminderTime
        .split(":")
        .map(Number);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: nativeId,
            title: notification.title,
            body: notification.body,
            channelId: "lectra-general",
            schedule: {
              // on: cron path → setExactAndAllowWhileIdle(RTC_WAKEUP)
              // Self-rescheduling: TimedNotificationPublisher re-fires nextTrigger()
              // after each delivery, advancing DAY_OF_MONTH automatically.
              on: { hour: drHour, minute: drMinute },
              allowWhileIdle: true,
            },
            extra: notification,
          },
        ],
      });

      continue;
    }

    if (notification.type === "weekly-summary") {
      const [wsHour, wsMinute] = settings.weeklySummaryTime
        .split(":")
        .map(Number);
      // JS Date.getDay(): 0=Sun … 6=Sat
      // Capacitor Weekday:  1=Sun … 7=Sat  → add 1
      const wsWeekday = (Number(settings.weeklySummaryDay) + 1) as Weekday;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: nativeId,
            title: notification.title,
            body: notification.body,
            channelId: "lectra-general",
            schedule: {
              // on: cron path → setExactAndAllowWhileIdle(RTC_WAKEUP)
              // Self-rescheduling: TimedNotificationPublisher re-fires nextTrigger()
              // after each delivery, advancing WEEK_OF_MONTH automatically.
              on: { weekday: wsWeekday, hour: wsHour, minute: wsMinute },
              allowWhileIdle: true,
            },
            extra: notification,
          },
        ],
      });

      continue;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: nativeId,
          title: notification.title,
          body: notification.body,
          channelId: "lectra-general",
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
  await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      recordNotificationToHistory(event.notification, true);
      handleNotificationClick(event.notification.extra as LectraNotification);
    },
  );
  await LocalNotifications.addListener(
    "localNotificationReceived",
    (notification) => {
      console.log(
        "🚨🚨🚨 LECTRA NOTIFICATION RECEIVED:",
        JSON.stringify(notification, null, 2),
      );
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
