import { Entry } from "@/types/entry";
import { generateNotifications } from "./engine";
import { NotificationManager } from "./manager";
import { showBrowserNotification } from "./browser";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { reconcileCapacitorNotifications } from "./capacitor";

export async function runNotificationScheduler(entries: Entry[]) {
  const settings = useNotificationSettingsStore.getState();

  if (!settings.enabled) {
    if (typeof window !== "undefined") {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        await reconcileCapacitorNotifications([], settings, entries);
      }
    }
    return;
  }

  const generated = generateNotifications(entries);
  const manager = new NotificationManager(generated);
  const notifications = manager.getAll();

  if (typeof window !== "undefined") {
    const { Capacitor } = await import("@capacitor/core");

    if (Capacitor.isNativePlatform()) {
      await reconcileCapacitorNotifications(notifications, settings, entries);
      // DO NOT record future scheduled notifications to history here.
      // History is only recorded when the notification actually triggers and is delivered.
      return;
    }
  }

  const now = Date.now();

  for (const notification of notifications) {
    // Only fire and record if the scheduled time has actually arrived right now (within last minute)
    if (
      notification.scheduledAt <= now &&
      notification.scheduledAt > now - 60 * 1000
    ) {
      showBrowserNotification(notification);
    }
  }
}