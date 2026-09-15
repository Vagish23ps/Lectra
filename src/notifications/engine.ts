import { Entry, WorkItem } from "@/types/entry";
import { CustomReminder } from "@/types/reminder";
import { LectraNotification } from "./notificationTypes";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { format } from "date-fns";

function formatDeadline(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, "d MMM yyyy");
}

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

function generateCustomReminderNotifications(
  reminder: CustomReminder,
  entry: Entry,
  work: WorkItem | undefined,
  now: number
): LectraNotification[] {
  if (reminder.enabled === false) return [];

  const notifications: LectraNotification[] = [];
  const isTask = !!work;
  const targetId = isTask ? work.id : entry.id;
  const idPrefix = isTask ? `custom-task` : `custom-entry`;
  const title = reminder.name?.trim() || (isTask ? "Task Reminder" : "Reminder");
  const body = isTask
    ? (work.task.trim() || "Task Reminder")
    : (entry.entryName.trim() || entry.subject.trim() || "Entry Reminder");

  const [hour, minute] = (reminder.time || "09:00").split(":").map(Number);

  const snoozedAt = reminder.snoozedUntil
    ? new Date(reminder.snoozedUntil).getTime()
    : null;
  const isCurrentlySnoozed = snoozedAt !== null && snoozedAt > now;

  if (isCurrentlySnoozed) {
    notifications.push({
      id: `${idPrefix}-snoozed-${targetId}`,
      type: "custom-reminder",
      title: `${title} (Snoozed)`,
      body,
      scheduledAt: snoozedAt,
      priority: "normal",
      entryId: entry.id,
      workId: isTask ? work.id : undefined,
      customReminder: reminder,
      read: false,
      createdAt: now,
    });

    if (reminder.type === "one-time") {
      return notifications;
    }
  }

  if (reminder.type === "one-time") {
    if (!reminder.date) return notifications;
    const [year, month, day] = reminder.date.split("-").map(Number);
    const scheduledDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    const scheduledAt = scheduledDate.getTime();

    if (scheduledAt > now) {
      notifications.push({
        id: `${idPrefix}-${targetId}`,
        type: "custom-reminder",
        title,
        body,
        scheduledAt,
        priority: "normal",
        entryId: entry.id,
        workId: isTask ? work.id : undefined,
        customReminder: reminder,
        read: false,
        createdAt: now,
      });
    }
  } else if (reminder.type === "recurring") {
    const frequency = reminder.recurrence?.frequency || "daily";

    if (frequency === "daily") {
      const scheduledDate = new Date(now);
      scheduledDate.setHours(hour, minute, 0, 0);
      if (scheduledDate.getTime() <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
      if (reminder.skipNextDate && format(scheduledDate, "yyyy-MM-dd") === reminder.skipNextDate) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
      notifications.push({
        id: `${idPrefix}-daily-${targetId}`,
        type: "custom-reminder",
        title,
        body,
        scheduledAt: scheduledDate.getTime(),
        priority: "normal",
        entryId: entry.id,
        workId: isTask ? work.id : undefined,
        customReminder: reminder,
        read: false,
        createdAt: now,
      });
    } else if (frequency === "weekly") {
      const targetDay = reminder.recurrence?.daysOfWeek?.[0] ?? 0;
      const scheduledDate = new Date(now);
      const currentDay = scheduledDate.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0) daysUntil += 7;
      scheduledDate.setDate(scheduledDate.getDate() + daysUntil);
      scheduledDate.setHours(hour, minute, 0, 0);
      if (scheduledDate.getTime() <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 7);
      }
      if (reminder.skipNextDate && format(scheduledDate, "yyyy-MM-dd") === reminder.skipNextDate) {
        scheduledDate.setDate(scheduledDate.getDate() + 7);
      }
      notifications.push({
        id: `${idPrefix}-weekly-${targetId}-${targetDay}`,
        type: "custom-reminder",
        title,
        body,
        scheduledAt: scheduledDate.getTime(),
        priority: "normal",
        entryId: entry.id,
        workId: isTask ? work.id : undefined,
        customReminder: reminder,
        read: false,
        createdAt: now,
      });
    } else if (frequency === "selected-days") {
      const days =
        reminder.recurrence?.daysOfWeek && reminder.recurrence.daysOfWeek.length > 0
          ? reminder.recurrence.daysOfWeek
          : [0];

      for (const targetDay of days) {
        const scheduledDate = new Date(now);
        const currentDay = scheduledDate.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        scheduledDate.setDate(scheduledDate.getDate() + daysUntil);
        scheduledDate.setHours(hour, minute, 0, 0);
        if (scheduledDate.getTime() <= now) {
          scheduledDate.setDate(scheduledDate.getDate() + 7);
        }
        if (reminder.skipNextDate && format(scheduledDate, "yyyy-MM-dd") === reminder.skipNextDate) {
          // If this specific day's occurrence is skipped, compute its NEXT occurrence
          scheduledDate.setDate(scheduledDate.getDate() + 7);
        }
        notifications.push({
          id: `${idPrefix}-day-${targetId}-${targetDay}`,
          type: "custom-reminder",
          title,
          body,
          scheduledAt: scheduledDate.getTime(),
          priority: "normal",
          entryId: entry.id,
          workId: isTask ? work.id : undefined,
          customReminder: reminder,
          read: false,
          createdAt: now,
        });
      }
    } else if (frequency === "monthly") {
      const targetDayOfMonth = Math.min(
        Math.max(reminder.recurrence?.dayOfMonth ?? 1, 1),
        28
      );
      const scheduledDate = new Date(now);
      scheduledDate.setDate(targetDayOfMonth);
      scheduledDate.setHours(hour, minute, 0, 0);
      if (scheduledDate.getTime() <= now) {
        scheduledDate.setMonth(scheduledDate.getMonth() + 1);
        scheduledDate.setDate(targetDayOfMonth);
        scheduledDate.setHours(hour, minute, 0, 0);
      }
      if (reminder.skipNextDate && format(scheduledDate, "yyyy-MM-dd") === reminder.skipNextDate) {
        scheduledDate.setMonth(scheduledDate.getMonth() + 1);
        scheduledDate.setDate(targetDayOfMonth);
        scheduledDate.setHours(hour, minute, 0, 0);
      }
      notifications.push({
        id: `${idPrefix}-monthly-${targetId}`,
        type: "custom-reminder",
        title,
        body,
        scheduledAt: scheduledDate.getTime(),
        priority: "normal",
        entryId: entry.id,
        workId: isTask ? work.id : undefined,
        customReminder: reminder,
        read: false,
        createdAt: now,
      });
    }
  }

  return notifications;
}

export function generateNotifications(
  entries: Entry[]
): LectraNotification[] {
  const notifications: LectraNotification[] = [];

  const now = Date.now();

  const settings = useNotificationSettingsStore.getState();

  let completedTasks = 0;
  let pendingTasks = 0;

  const isCustomRemindersEnabled =
    settings.customReminders ?? settings.customRemindersEnabled ?? true;

  entries.forEach((entry) => {
    // Custom Reminder for Entry
    if (isCustomRemindersEnabled && entry.reminder) {
      const entryReminders = generateCustomReminderNotifications(
        entry.reminder,
        entry,
        undefined,
        now
      );
      notifications.push(...entryReminders);
    }

    entry.works.forEach((work) => {
      // Custom Reminder for Task
      if (isCustomRemindersEnabled && !work.completed && work.reminder) {
        const taskReminders = generateCustomReminderNotifications(
          work.reminder,
          entry,
          work,
          now
        );
        notifications.push(...taskReminders);
      }

      if (work.completed) {
        completedTasks++;
        return;
      }

      if (!work.addToPending || !work.deadline) return;

      pendingTasks++;
      const formattedDeadline = formatDeadline(work.deadline);

      // Due Tomorrow
      if (settings.dueTomorrowReminder ?? settings.dueTomorrowEnabled ?? true) {
        const scheduledAt = createScheduledDate(
          work.deadline,
          settings.dueTomorrowReminderTime,
          -1
        ).getTime();

        if (scheduledAt > now) {
          notifications.push({
            id: `deadline-tomorrow-${work.id}`,
            type: "deadline-tomorrow",
            title: "Due Tomorrow",
            body: `"${work.task}" is due tomorrow. Deadline: ${formattedDeadline}`,
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
      if (settings.dueTodayReminder ?? settings.dueTodayEnabled ?? true) {
        const scheduledAt = createScheduledDate(
          work.deadline,
          settings.dueTodayReminderTime,
          0
        ).getTime();

        if (scheduledAt > now) {
          notifications.push({
            id: `deadline-today-${work.id}`,
            type: "deadline-today",
            title: "Due Today",
            body: `"${work.task}" is due today. Deadline: ${formattedDeadline}`,
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
      if (settings.overdueReminder ?? settings.overdueEnabled ?? true) {
        const [dYear, dMonth, dDay] = work.deadline.split("-").map(Number);
        const deadlineDate = new Date(dYear, dMonth - 1, dDay, 0, 0, 0, 0);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        if (deadlineDate < todayStart) {
          const [ovHour, ovMinute] = settings.overdueReminderTime
            .split(":")
            .map(Number);
          const scheduledDate = new Date(now);
          scheduledDate.setHours(ovHour, ovMinute, 0, 0);
          const scheduledAt = scheduledDate.getTime();

          if (scheduledAt > now) {
            notifications.push({
              id: `overdue-${work.id}`,
              type: "overdue",
              title: "Overdue Task",
              body: `"${work.task}" is overdue. Deadline: ${formattedDeadline}`,
              scheduledAt,
              priority: "high",
              entryId: entry.id,
              workId: work.id,
              read: false,
              createdAt: now,
            });
          }
        }
      }
    });
  });

  // Weekly Summary
  const totalEntries = entries.length;

  if (
    (settings.weeklySummary ?? settings.weeklySummaryEnabled ?? true) &&
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
      title: "Weekly Check-in",
      body: `${pendingTasks} Pending • ${completedTasks} Completed`,
      scheduledAt: scheduledAt.getTime(),
      priority: "low",
      read: false,
      createdAt: now,
    });
  }

  // Deduplicate notifications by deterministic ID to prevent duplicates
  const uniqueNotifications = new Map<string, LectraNotification>();
  for (const notif of notifications) {
    if (!uniqueNotifications.has(notif.id)) {
      uniqueNotifications.set(notif.id, notif);
    }
  }

  return Array.from(uniqueNotifications.values());
}