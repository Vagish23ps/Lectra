import { useMemo } from "react";
import { format } from "date-fns";
import { useEntryStore } from "@/store/entryStore";
import { useActiveReminders } from "./useActiveReminders";

export interface UpcomingItem {
  id: string;
  type: "task" | "reminder";
  title: string;
  entryTitle: string;
  entryId: string;
  workId?: string;
  urgencyCategory: 1 | 2 | 3 | 4; // 1: Overdue, 2: Due Today, 3: Tomorrow, 4: Later
  categoryLabel: "Overdue" | "Due Today" | "Tomorrow" | "Upcoming";
  dueTimestamp: number;
  formattedDue: string;
  badgeClass: string;
  textClass: string;
  isRecurring?: boolean;
  recurrenceText?: string;
}

export function useUpcomingItems(): {
  taskItems: UpcomingItem[];
  reminderItems: UpcomingItem[];
  upcomingItems: UpcomingItem[];
  hasTaskItems: boolean;
  hasReminderItems: boolean;
  hasItems: boolean;
} {
  const entries = useEntryStore((state) => state.entries);
  const { activeReminders } = useActiveReminders();

  return useMemo(() => {
    const taskItems: UpcomingItem[] = [];
    const reminderItems: UpcomingItem[] = [];
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowMidnight = todayMidnight + 24 * 60 * 60 * 1000;
    const dayAfterTomorrow = todayMidnight + 48 * 60 * 60 * 1000;

    // 1. Process Tasks from Entries
    for (const entry of entries) {
      const entryTitle = entry.entryName || entry.subject || "Untitled Entry";

      for (const work of entry.works) {
        if (work.completed || !work.task.trim()) continue;

        if (work.deadline) {
          try {
            const [year, month, day] = work.deadline.split("-").map(Number);
            const deadlineDate = new Date(year, month - 1, day, 23, 59, 59, 999);
            const deadlineTime = deadlineDate.getTime();

            let urgency: 1 | 2 | 3 | 4 = 4;
            let categoryLabel: "Overdue" | "Due Today" | "Tomorrow" | "Upcoming" = "Upcoming";
            let badgeClass = "bg-secondary text-muted-foreground border-border";
            let textClass = "text-muted-foreground";

            if (deadlineTime < todayMidnight) {
              urgency = 1;
              categoryLabel = "Overdue";
              badgeClass = "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20";
              textClass = "text-red-500 dark:text-red-400";
            } else if (deadlineTime < tomorrowMidnight) {
              urgency = 2;
              categoryLabel = "Due Today";
              badgeClass = "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20";
              textClass = "text-orange-500 dark:text-orange-400";
            } else if (deadlineTime < dayAfterTomorrow) {
              urgency = 3;
              categoryLabel = "Tomorrow";
              badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
              textClass = "text-amber-600 dark:text-amber-400";
            } else {
              urgency = 4;
              categoryLabel = "Upcoming";
              badgeClass = "bg-primary/10 text-primary border-primary/20";
              textClass = "text-primary";
            }

            const formattedDue = format(new Date(year, month - 1, day), "dd MMM");

            taskItems.push({
              id: `task-${work.id}`,
              type: "task",
              title: work.task,
              entryTitle,
              entryId: entry.id,
              workId: work.id,
              urgencyCategory: urgency,
              categoryLabel,
              dueTimestamp: deadlineTime,
              formattedDue,
              badgeClass,
              textClass,
            });
          } catch (e) {
            console.error("Invalid deadline date:", work.deadline, e);
          }
        }
      }
    }

    // 2. Process Active Reminders (independent of tasks)
    for (const r of activeReminders) {
      if (!r.nextOccurrence) continue;
      const remTime = r.nextOccurrence.getTime();

      let urgency: 1 | 2 | 3 | 4 = 4;
      let categoryLabel: "Overdue" | "Due Today" | "Tomorrow" | "Upcoming" = "Upcoming";
      let badgeClass = "bg-secondary text-muted-foreground border-border";
      let textClass = "text-muted-foreground";

      if (remTime < now.getTime()) {
        urgency = 1;
        categoryLabel = "Overdue";
        badgeClass = "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20";
        textClass = "text-red-500 dark:text-red-400";
      } else if (remTime < tomorrowMidnight) {
        urgency = 2;
        categoryLabel = "Due Today";
        badgeClass = "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20";
        textClass = "text-orange-500 dark:text-orange-400";
      } else if (remTime < dayAfterTomorrow) {
        urgency = 3;
        categoryLabel = "Tomorrow";
        badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        textClass = "text-amber-600 dark:text-amber-400";
      } else {
        urgency = 4;
        categoryLabel = "Upcoming";
        badgeClass = "bg-primary/10 text-primary border-primary/20";
        textClass = "text-primary";
      }

      const formattedDue = format(r.nextOccurrence, "hh:mm a");
      const isRecurring = r.reminder.type === "recurring";
      const recurrenceText = isRecurring
        ? `Repeats ${r.reminder.recurrence?.frequency || "daily"}`
        : "One-time";

      reminderItems.push({
        id: `reminder-${r.entryId}-${r.workId || "entry"}`,
        type: "reminder",
        title: r.workTask || r.entryName,
        entryTitle: r.entryName,
        entryId: r.entryId,
        workId: r.workId,
        urgencyCategory: urgency,
        categoryLabel,
        dueTimestamp: remTime,
        formattedDue: `${format(r.nextOccurrence, "dd MMM")} • ${formattedDue}`,
        badgeClass,
        textClass,
        isRecurring,
        recurrenceText,
      });
    }

    const sortFn = (a: UpcomingItem, b: UpcomingItem) => {
      if (a.urgencyCategory !== b.urgencyCategory) {
        return a.urgencyCategory - b.urgencyCategory;
      }
      return a.dueTimestamp - b.dueTimestamp;
    };

    taskItems.sort(sortFn);
    reminderItems.sort(sortFn);

    const topTasks = taskItems.slice(0, 3);
    const topReminders = reminderItems.slice(0, 3);
    const combined = [...taskItems, ...reminderItems].sort(sortFn).slice(0, 3);

    return {
      taskItems: topTasks,
      reminderItems: topReminders,
      upcomingItems: combined,
      hasTaskItems: topTasks.length > 0,
      hasReminderItems: topReminders.length > 0,
      hasItems: topTasks.length > 0 || topReminders.length > 0,
    };
  }, [entries, activeReminders]);
}
