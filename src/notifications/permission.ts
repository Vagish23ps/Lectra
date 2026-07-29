import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export async function requestNotificationPermission() {
  // Android / iOS (Capacitor)
  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.requestPermissions();

    return permission.display;
  }

  // Browser
  if (!("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return await Notification.requestPermission();
}