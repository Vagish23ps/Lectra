import { Entry } from "@/types/entry";
import { generateNotifications } from "./engine";
import { NotificationManager } from "./manager";
import { showBrowserNotification } from "./browser";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { reconcileCapacitorNotifications } from "./capacitor";

export async function runNotificationScheduler(entries: Entry[]) {
  const settings = useNotificationSettingsStore.getState();

  if (!settings.enabled) return;

  const generated = generateNotifications(entries);
  const manager = new NotificationManager(generated);
  const notifications = manager.getAll();

  if (typeof window !== "undefined") {
    const { Capacitor } = await import("@capacitor/core");

    if (Capacitor.isNativePlatform()) {
      await reconcileCapacitorNotifications(notifications, settings);
      return;
    }
  }

  const now = Date.now();

  for (const notification of notifications) {
    if (
      notification.scheduledAt <= now &&
      notification.scheduledAt > now - 60 * 1000
    ) {
      showBrowserNotification(notification);
    }
  }
}