import { CustomReminder } from "@/types/reminder";
import { format } from "date-fns";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatTime12h(time24: string): string {
  if (!time24) return "09:00 AM";
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

export function formatReminderSummary(reminder: CustomReminder): string {
  const timeFormatted = formatTime12h(reminder.time);
  let base = `At ${timeFormatted}`;

  if (reminder.type === "one-time") {
    if (reminder.date) {
      const [year, month, day] = reminder.date.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      const today = new Date();
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month - 1 &&
        today.getDate() === day;

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        tomorrow.getFullYear() === year &&
        tomorrow.getMonth() === month - 1 &&
        tomorrow.getDate() === day;

      if (isToday) {
        base = `Today at ${timeFormatted}`;
      } else if (isTomorrow) {
        base = `Tomorrow at ${timeFormatted}`;
      } else {
        base = `${format(dateObj, "d MMM yyyy")} at ${timeFormatted}`;
      }
    }
  } else {
    // Recurring
    const freq = reminder.recurrence?.frequency || "daily";

    if (freq === "daily") {
      base = `Every day at ${timeFormatted}`;
    } else if (freq === "weekly") {
      const day = reminder.recurrence?.daysOfWeek?.[0] ?? 0;
      base = `Every ${WEEKDAYS[day]} at ${timeFormatted}`;
    } else if (freq === "selected-days") {
      const days = reminder.recurrence?.daysOfWeek || [0];
      const dayNames = days.map((d) => WEEKDAYS_SHORT[d]).join(", ");
      base = `Every ${dayNames} at ${timeFormatted}`;
    } else if (freq === "monthly") {
      const dayOfMonth = reminder.recurrence?.dayOfMonth ?? 1;
      base = `Every month on day ${dayOfMonth} at ${timeFormatted}`;
    }
  }

  return reminder.name?.trim() ? `${reminder.name.trim()} — ${base}` : base;
}
