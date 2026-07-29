import {
  LocalNotifications,
} from "@capacitor/local-notifications";

import { LectraNotification } from "./notificationTypes";
import { handleNotificationClick } from "./actions";

export async function showCapacitorNotification(
  notification: LectraNotification
) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Date.now() / 1000),
        title: notification.title,
        body: notification.body,
        channelId: "lectra-general",
        extra: notification,
      },
    ],
  });
}

LocalNotifications.addListener(
  "localNotificationActionPerformed",
  (event) => {
    handleNotificationClick(event.notification.extra as LectraNotification);
  }
);