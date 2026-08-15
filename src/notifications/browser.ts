import { LectraNotification } from "./notificationTypes";
import { handleNotificationClick } from "./actions";
import { recordNotificationToHistory } from "./history";

export async function showBrowserNotification(
  notification: LectraNotification
) {
  if (Notification.permission !== "granted") return;

  recordNotificationToHistory(notification);

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