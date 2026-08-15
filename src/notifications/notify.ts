import { Capacitor } from "@capacitor/core";
import { LectraNotification } from "./notificationTypes";
import { showBrowserNotification } from "./browser";
import { scheduleCapacitorNotification } from "./capacitor";

export async function showNotification(
  notification: LectraNotification
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await scheduleCapacitorNotification(
  notification,
  Math.floor(Date.now() / 1000)
);
    return;
  }

  showBrowserNotification(notification);
}