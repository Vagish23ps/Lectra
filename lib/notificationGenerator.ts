import { Entry } from "@/types/entry";
import {
  NotificationItem,
  NotificationPriority,
  NotificationType,
} from "@/types/notification";

export function generateNotifications(
  entries: Entry[]
): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  entries.forEach((entry) => {
    entry.works.forEach((work) => {
      if (
        !work.addToPending ||
        work.completed ||
        !work.task.trim()
      ) {
        return;
      }

      if (!work.deadline) return;

      const deadline = new Date(`${work.deadline}T00:00:00`);
      deadline.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (deadline.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let type: NotificationType | null = null;
      let priority: NotificationPriority = "low";
      let title = "";
      let message = "";

      if (diffDays < 0) {
        type = "overdue";
        priority = "critical";
        title = "Task Overdue";
        message = `"${work.task}" is overdue by ${Math.abs(
          diffDays
        )} day${Math.abs(diffDays) === 1 ? "" : "s"}.`;
      } else if (diffDays === 0) {
        type = "deadline";
        priority = "high";
        title = "Due Today";
        message = `"${work.task}" is due today.`;
      } else if (diffDays === 1) {
        type = "upcoming";
        priority = "medium";
        title = "Due Tomorrow";
        message = `"${work.task}" is due tomorrow.`;
      }

      if (type) {
        notifications.push({
          id: `${entry.id}-${work.id}-${type}`,
          title,
          message,
          type,
          priority,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });
  });

  notifications.sort((a, b) => {
    const priorityOrder = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return (
      priorityOrder[b.priority] -
      priorityOrder[a.priority]
    );
  });

  return notifications;
}