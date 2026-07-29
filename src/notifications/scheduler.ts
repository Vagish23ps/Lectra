import { Entry } from "@/types/entry";
import { generateNotifications } from "./engine";
import { NotificationManager } from "./manager";
import { requestNotificationPermission } from "./permission";
import { showNotification } from "./notify";
import { wasNotificationShown, markNotificationShown } from "./storage";
import { isTimeToNotify } from "./time";
import { notificationQueue } from "./queue";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { addHistory } from "./history";


export async function runNotificationScheduler(entries: Entry[]) {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return;

  const settings = useNotificationSettingsStore.getState();

  if (!settings.enabled) return;

  const generated = generateNotifications(entries);
  const manager = new NotificationManager(generated);
  const notifications = manager.getAll();
  

  notificationQueue.clear();

  for (const notification of notifications) {
  if (wasNotificationShown(notification.id)) continue;

  let shouldShowNow = false;

  switch (notification.type) {
    case "daily-reminder":
      shouldShowNow =
        settings.dailyReminder &&
        isTimeToNotify(settings.dailyReminderTime);
      break;

    case "overdue":
      shouldShowNow =
        settings.overdueReminder &&
        isTimeToNotify(settings.overdueReminderTime);
      break;

    case "deadline-today":
      shouldShowNow =
        settings.dueTodayReminder &&
        isTimeToNotify(settings.dueTodayReminderTime);
      break;

    case "deadline-tomorrow":
      shouldShowNow =
        settings.dueTomorrowReminder &&
        isTimeToNotify(settings.dueTomorrowReminderTime);
      break;

    case "weekly-summary": {
      const today = new Date().getDay();
      const selectedDay = Number(settings.weeklySummaryDay);

     console.log("Weekly summary case reached");

      shouldShowNow =
        settings.weeklySummary &&
        today === selectedDay;

      break;
    }
  }

  if (!shouldShowNow) continue;

  notificationQueue.add(notification);
  markNotificationShown(notification.id);
}

  for (const notification of notificationQueue.getAll()) {

  addHistory({
    id: crypto.randomUUID(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    createdAt: new Date().toISOString(),
    read: false,
  });

  await showNotification(notification);
}

  notificationQueue.clear();
}