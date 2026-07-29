import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export async function createNotificationChannels() {
  if (!Capacitor.isNativePlatform()) return;

  await LocalNotifications.createChannel({
    id: "lectra-general",
    name: "General Notifications",
    description: "General notifications from Lectra",
    importance: 4,
    visibility: 1,
  });

  await LocalNotifications.createChannel({
    id: "lectra-reminders",
    name: "Reminders",
    description: "Daily and scheduled reminders",
    importance: 4,
    visibility: 1,
  });

  await LocalNotifications.createChannel({
    id: "lectra-deadlines",
    name: "Deadlines",
    description: "Task deadline notifications",
    importance: 5,
    visibility: 1,
  });
}