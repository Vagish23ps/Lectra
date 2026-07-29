import { NotificationItem, useNotificationStore } from "@/store/notificationStore";

export function addHistory(
  notification: NotificationItem
) {
  useNotificationStore
    .getState()
    .addNotification(notification);
}