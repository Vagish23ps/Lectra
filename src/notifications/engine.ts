import { Entry } from "@/types/entry";
import { LectraNotification } from "./notificationTypes";
import { isToday, isTomorrow, isOverdue } from "./helpers";

export function generateNotifications(
  entries: Entry[]
): LectraNotification[] {
  const notifications: LectraNotification[] = [];

  const now = Date.now();

  const overdueTasks: string[] = [];
  const dueTodayTasks: string[] = [];
  const dueTomorrowTasks: string[] = [];

  let completedTasks = 0;
  let pendingTasks = 0;

  entries.forEach((entry) => {
    entry.works.forEach((work) => {
      if (work.completed) {
        completedTasks++;
        return;
      }

      if (!work.addToPending) return;

      pendingTasks++;

      if (!work.deadline) return;

      const deadline = new Date(work.deadline);

      if (isOverdue(deadline)) {
        overdueTasks.push(work.task);
        return;
      }

      if (isToday(deadline)) {
        dueTodayTasks.push(work.task);
        return;
      }

      if (isTomorrow(deadline)) {
        dueTomorrowTasks.push(work.task);
      }
    });
  });

  // Overdue Reminder
  if (overdueTasks.length > 0) {
    notifications.push({
      id: "overdue",
      type: "overdue",
      title: "🔴 Overdue Tasks",
      body: `You have ${overdueTasks.length} overdue task${
        overdueTasks.length > 1 ? "s" : ""
      }.`,
      scheduledAt: now,
      priority: "high",
      read: false,
      createdAt: now,
    });
  }

  // Due Today Reminder
  if (dueTodayTasks.length > 0) {
    notifications.push({
      id: "deadline-today",
      type: "deadline-today",
      title: "📅 Due Today",
      body: `You have ${dueTodayTasks.length} task${
        dueTodayTasks.length > 1 ? "s" : ""
      } due today.`,
      scheduledAt: now,
      priority: "high",
      read: false,
      createdAt: now,
    });
  }

  // Due Tomorrow Reminder
  if (dueTomorrowTasks.length > 0) {
    notifications.push({
      id: "deadline-tomorrow",
      type: "deadline-tomorrow",
      title: "⏰ Due Tomorrow",
      body: `You have ${dueTomorrowTasks.length} task${
        dueTomorrowTasks.length > 1 ? "s" : ""
      } due tomorrow.`,
      scheduledAt: now,
      priority: "normal",
      read: false,
      createdAt: now,
    });
  }

  // Weekly Summary
  const totalEntries = entries.length;

  if (
    totalEntries > 0 ||
    completedTasks > 0 ||
    pendingTasks > 0
  ) {
    notifications.push({
      id: "weekly-summary",
      type: "weekly-summary",
      title: "📊 Weekly Check-in",
      body: `⏳ ${pendingTasks} Pending • ⚠️ ${overdueTasks.length} Overdue • ✅ ${completedTasks} Completed`,
      scheduledAt: now,
      priority: "low",
      read: false,
      createdAt: now,
    });
  }

  // Daily Reminder
  notifications.push({
    id: "daily-reminder",
    type: "daily-reminder",
    title: "📚 Daily Reminder",
    body: "Don't forget to check your tasks for today and tomorrow!",
    scheduledAt: now,
    priority: "normal",
    read: false,
    createdAt: now,
  });

  return notifications;
}