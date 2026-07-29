import { Capacitor } from "@capacitor/core";
import { LectraNotification } from "./notificationTypes";
import { handleNotificationClick } from "./actions";
import { showCapacitorNotification } from "./capacitor";

export async function showBrowserNotification(
  notification: LectraNotification
) {
  if (Capacitor.isNativePlatform()) {
    return showCapacitorNotification(notification);
  }

  if (Notification.permission !== "granted") return;

  const browserNotification = new Notification(notification.title, {
    body: notification.body,
    icon: "/favicon.png",
    badge: "/favicon.png",
  });

  browserNotification.onclick = () => {
    window.focus();
    handleNotificationClick(notification);
    browserNotification.close();
  };
}