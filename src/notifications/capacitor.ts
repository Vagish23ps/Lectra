import { LocalNotifications } from "@capacitor/local-notifications";
import { LectraNotification } from "./notificationTypes";
import { handleNotificationClick } from "./actions";
import { getNotificationNativeId } from "./ids";

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
              every: "day",
              allowWhileIdle: true,
            },
            extra: notification,
          },
        ],
      });

      continue;
    }

    if (notification.type === "weekly-summary") {
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
              every: "week",
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

export async function initializeCapacitorNotificationActions() {
  await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      handleNotificationClick(event.notification.extra as LectraNotification);
    },
  );
  LocalNotifications.addListener(
    "localNotificationReceived",
    (notification) => {
      console.log(
        "🚨🚨🚨 LECTRA NOTIFICATION RECEIVED:",
        JSON.stringify(notification, null, 2),
      );
    },
  );
}
export async function debugNotificationState() {
  const pending = await LocalNotifications.getPending();
  const delivered = await LocalNotifications.getDeliveredNotifications();

  console.log(
    "🚨 NOTIFICATION DEBUG PENDING:",
    JSON.stringify(pending, null, 2),
  );

  console.log(
    "🚨 NOTIFICATION DEBUG DELIVERED:",
    JSON.stringify(delivered, null, 2),
  );
}
