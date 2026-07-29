import { Capacitor } from "@capacitor/core";
import { LectraNotification } from "./notificationTypes";
import { showBrowserNotification } from "./browser";
import { showCapacitorNotification } from "./capacitor";

export async function showNotification(
  notification: LectraNotification
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await showCapacitorNotification(notification);
    return;
  }

  showBrowserNotification(notification);
}