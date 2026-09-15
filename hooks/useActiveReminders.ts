import { useMemo } from "react";
import { format } from "date-fns";
import { useEntryStore } from "@/store/entryStore";
import { CustomReminder } from "@/types/reminder";

export interface ActiveReminderItem {
  reminder: CustomReminder;
  entryId: string;
  entryName: string;
  subject: string;
  workId?: string;
  workTask?: string;
  isTask: boolean;
  nextOccurrence: Date | null;
  isExpired: boolean;
  isSnoozed: boolean;
  snoozedUntilDate: Date | null;
  isSkipped: boolean;
}

function computeNextOccurrence(reminder: CustomReminder): Date | null {
  const now = new Date();

  // If currently snoozed, the immediate next occurrence is the snoozed time
  if (reminder.snoozedUntil) {
    const snoozedDate = new Date(reminder.snoozedUntil);
    if (snoozedDate.getTime() > now.getTime()) {
      return snoozedDate;
    }
  }

  const [hour, minute] = (reminder.time || "09:00").split(":").map(Number);

  if (reminder.type === "one-time") {
    if (!reminder.date) return null;
    const [year, month, day] = reminder.date.split("-").map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  if (reminder.type === "recurring") {
    let next: Date | null = null;
    const frequency = reminder.recurrence?.frequency || "daily";

    if (frequency === "daily") {
      next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
      }
      if (reminder.skipNextDate && format(next, "yyyy-MM-dd") === reminder.skipNextDate) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    if (frequency === "weekly") {
      const targetDay = reminder.recurrence?.daysOfWeek?.[0] ?? 0;
      next = new Date(now);
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0) daysUntil += 7;
      next.setDate(next.getDate() + daysUntil);
      next.setHours(hour, minute, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 7);
      }
      if (reminder.skipNextDate && format(next, "yyyy-MM-dd") === reminder.skipNextDate) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }

    if (frequency === "selected-days") {
      const days = reminder.recurrence?.daysOfWeek || [0];
      if (days.length === 0) return null;

      let earliest: Date | null = null;

      for (const targetDay of days) {
        const candidate = new Date(now);
        const currentDay = candidate.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        candidate.setDate(candidate.getDate() + daysUntil);
        candidate.setHours(hour, minute, 0, 0);
        if (candidate.getTime() <= now.getTime()) {
          candidate.setDate(candidate.getDate() + 7);
        }
        if (reminder.skipNextDate && format(candidate, "yyyy-MM-dd") === reminder.skipNextDate) {
          candidate.setDate(candidate.getDate() + 7);
        }

        if (!earliest || candidate.getTime() < earliest.getTime()) {
          earliest = candidate;
        }
      }

      return earliest;
    }

    if (frequency === "monthly") {
      const targetDayOfMonth = Math.min(
        Math.max(reminder.recurrence?.dayOfMonth ?? 1, 1),
        28
      );
      next = new Date(now);
      next.setDate(targetDayOfMonth);
      next.setHours(hour, minute, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDayOfMonth);
        next.setHours(hour, minute, 0, 0);
      }
      if (reminder.skipNextDate && format(next, "yyyy-MM-dd") === reminder.skipNextDate) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDayOfMonth);
        next.setHours(hour, minute, 0, 0);
      }
      return next;
    }
  }

  return null;
}

export function useActiveReminders() {
  const entries = useEntryStore((state) => state.entries);

  return useMemo(() => {
    const allReminders: ActiveReminderItem[] = [];
    const now = new Date();

    for (const entry of entries) {
      // Entry-level reminder
      if (entry.reminder) {
        const nextOccurrence = computeNextOccurrence(entry.reminder);
        const snoozedDate = entry.reminder.snoozedUntil
          ? new Date(entry.reminder.snoozedUntil)
          : null;
        const isSnoozed =
          snoozedDate !== null && snoozedDate.getTime() > now.getTime();
        const isExpired =
          entry.reminder.type === "one-time" &&
          !isSnoozed &&
          nextOccurrence !== null &&
          nextOccurrence.getTime() <= now.getTime();
        const isSkipped = Boolean(
          entry.reminder.type === "recurring" &&
          entry.reminder.skipNextDate &&
          entry.reminder.skipNextDate >= format(now, "yyyy-MM-dd")
        );

        allReminders.push({
          reminder: entry.reminder,
          entryId: entry.id,
          entryName: entry.entryName || "Untitled",
          subject: entry.subject || "",
          isTask: false,
          nextOccurrence,
          isExpired,
          isSnoozed,
          snoozedUntilDate: isSnoozed ? snoozedDate : null,
          isSkipped,
        });
      }

      // Task-level reminders
      for (const work of entry.works) {
        if (work.reminder) {
          const nextOccurrence = computeNextOccurrence(work.reminder);
          const snoozedDate = work.reminder.snoozedUntil
            ? new Date(work.reminder.snoozedUntil)
            : null;
          const isSnoozed =
            snoozedDate !== null && snoozedDate.getTime() > now.getTime();
          const isExpired =
            work.reminder.type === "one-time" &&
            !isSnoozed &&
            nextOccurrence !== null &&
            nextOccurrence.getTime() <= now.getTime();
          const isSkipped = Boolean(
            work.reminder.type === "recurring" &&
            work.reminder.skipNextDate &&
            work.reminder.skipNextDate >= format(now, "yyyy-MM-dd")
          );

          allReminders.push({
            reminder: work.reminder,
            entryId: entry.id,
            entryName: entry.entryName || "Untitled",
            subject: entry.subject || "",
            workId: work.id,
            workTask: work.task || "Untitled task",
            isTask: true,
            nextOccurrence,
            isExpired,
            isSnoozed,
            snoozedUntilDate: isSnoozed ? snoozedDate : null,
            isSkipped,
          });
        }
      }
    }

    // Sort: active first (by next occurrence), then paused, then expired
    allReminders.sort((a, b) => {
      // Paused items go to the end
      if (a.reminder.enabled !== b.reminder.enabled) {
        return a.reminder.enabled ? -1 : 1;
      }
      // Expired items after active
      if (a.isExpired !== b.isExpired) {
        return a.isExpired ? 1 : -1;
      }
      // Sort by next occurrence
      const aTime = a.nextOccurrence?.getTime() ?? Infinity;
      const bTime = b.nextOccurrence?.getTime() ?? Infinity;
      return aTime - bTime;
    });

    const activeReminders = allReminders.filter(
      (r) => r.reminder.enabled && !r.isExpired
    );
    const pausedReminders = allReminders.filter(
      (r) => !r.reminder.enabled
    );
    const expiredReminders = allReminders.filter(
      (r) => r.reminder.enabled && r.isExpired
    );

    return {
      allReminders,
      activeReminders,
      pausedReminders,
      expiredReminders,
      totalActiveCount: activeReminders.length,
      totalPausedCount: pausedReminders.length,
      totalCount: allReminders.length,
    };
  }, [entries]);
}
