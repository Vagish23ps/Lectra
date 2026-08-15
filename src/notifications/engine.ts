import { Entry } from "@/types/entry";
import { LectraNotification } from "./notificationTypes";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";

function createScheduledDate(
  dateString: string,
  timeString: string,
  dayOffset: number
): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  date.setDate(date.getDate() + dayOffset);

  return date;
}

export function generateNotifications(
  entries: Entry[]
): LectraNotification[] {
  const notifications: LectraNotification[] = [];

  const now = Date.now();

  const settings = useNotificationSettingsStore.getState();

  let completedTasks = 0;
  let pendingTasks = 0;

  entries.forEach((entry) => {
    entry.works.forEach((work) => {
      if (work.completed) {
        completedTasks++;
        return;
      }

      if (!work.addToPending || !work.deadline) return;

      pendingTasks++;


      // Due Tomorrow
      if (settings.dueTomorrowReminder) {
        const scheduledAt = createScheduledDate(
          work.deadline,
          settings.dueTomorrowReminderTime,
          -1
        ).getTime();

        if (scheduledAt > now) {
          notifications.push({
            id: `deadline-tomorrow-${work.id}`,
            type: "deadline-tomorrow",
            title: "⏰ Due Tomorrow",
            body: `"${work.task}" is due tomorrow.`,
            scheduledAt,
            priority: "normal",
            entryId: entry.id,
            workId: work.id,
            read: false,
            createdAt: now,
          });
        }
      }

      // Due Today
      if (settings.dueTodayReminder) {
        const scheduledAt = createScheduledDate(
          work.deadline,
          settings.dueTodayReminderTime,
          0
        ).getTime();

        if (scheduledAt > now) {
          notifications.push({
            id: `deadline-today-${work.id}`,
            type: "deadline-today",
            title: "📅 Due Today",
            body: `"${work.task}" is due today.`,
            scheduledAt,
            priority: "high",
            entryId: entry.id,
            workId: work.id,
            read: false,
            createdAt: now,
          });
        }
      }

      // Overdue
      if (settings.overdueReminder) {
        const scheduledAt = createScheduledDate(
          work.deadline,
          settings.overdueReminderTime,
          1
        ).getTime();

        if (scheduledAt > now) {
          notifications.push({
            id: `overdue-${work.id}`,
            type: "overdue",
            title: "🔴 Overdue Task",
            body: `"${work.task}" is overdue.`,
            scheduledAt,
            priority: "high",
            entryId: entry.id,
            workId: work.id,
            read: false,
            createdAt: now,
          });
        }
      }
    });
  });

  // Weekly Summary
  const totalEntries = entries.length;

  if (
    settings.weeklySummary &&
    (totalEntries > 0 ||
      completedTasks > 0 ||
      pendingTasks > 0)
  ) {
    const today = new Date();
    const selectedDay = Number(settings.weeklySummaryDay);

    const scheduledAt = new Date(today);

    const currentDay = today.getDay();
    let daysUntil = selectedDay - currentDay;

    if (daysUntil < 0) {
      daysUntil += 7;
    }

    scheduledAt.setDate(today.getDate() + daysUntil);

    const [hour, minute] = settings.weeklySummaryTime
      .split(":")
      .map(Number);

    scheduledAt.setHours(hour, minute, 0, 0);

    if (scheduledAt.getTime() <= now) {
      scheduledAt.setDate(scheduledAt.getDate() + 7);
    }

    notifications.push({
      id: "weekly-summary",
      type: "weekly-summary",
      title: "📊 Weekly Check-in",
      body: `⏳ ${pendingTasks} Pending • ✅ ${completedTasks} Completed`,
      scheduledAt: scheduledAt.getTime(),
      priority: "low",
      read: false,
      createdAt: now,
    });
  }

  // Daily Reminder
  if (settings.dailyReminder) {
    const scheduledAt = new Date();
    const [hour, minute] = settings.dailyReminderTime
      .split(":")
      .map(Number);

    scheduledAt.setHours(hour, minute, 0, 0);

    if (scheduledAt.getTime() <= now) {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
    }

    notifications.push({
      id: "daily-reminder",
      type: "daily-reminder",
      title: "📚 Daily Reminder",
      body: "Don't forget to check your tasks for today and tomorrow!",
      scheduledAt: scheduledAt.getTime(),
      priority: "normal",
      read: false,
      createdAt: now,
    });
  }

  return notifications;
}