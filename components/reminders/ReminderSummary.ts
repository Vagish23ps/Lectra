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

  if (reminder.type === "one-time") {
    if (!reminder.date) return `🔔 At ${timeFormatted}`;
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
      return `🔔 Today at ${timeFormatted}`;
    }
    if (isTomorrow) {
      return `🔔 Tomorrow at ${timeFormatted}`;
    }
    return `🔔 ${format(dateObj, "d MMM yyyy")} at ${timeFormatted}`;
  }

  // Recurring
  const freq = reminder.recurrence?.frequency || "daily";

  if (freq === "daily") {
    return `🔁 Every day at ${timeFormatted}`;
  }

  if (freq === "weekly") {
    const day = reminder.recurrence?.daysOfWeek?.[0] ?? 0;
    return `🔁 Every ${WEEKDAYS[day]} at ${timeFormatted}`;
  }

  if (freq === "selected-days") {
    const days = reminder.recurrence?.daysOfWeek || [0];
    const dayNames = days.map((d) => WEEKDAYS_SHORT[d]).join(", ");
    return `🔁 Every ${dayNames} at ${timeFormatted}`;
  }

  if (freq === "monthly") {
    const dayOfMonth = reminder.recurrence?.dayOfMonth ?? 1;
    return `🔁 Every month on day ${dayOfMonth} at ${timeFormatted}`;
  }

  return `🔔 At ${timeFormatted}`;
}
