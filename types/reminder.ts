export type ReminderFrequency = "daily" | "weekly" | "monthly" | "selected-days";

export interface CustomReminder {
  id: string;
  name?: string; // Optional custom name. If empty, falls back to entry/task title
  enabled: boolean;
  time: string; // "HH:MM" 24-hour format
  type: "one-time" | "recurring";
  date?: string; // "YYYY-MM-DD" for one-time reminders
  recurrence?: {
    frequency: ReminderFrequency;
    daysOfWeek?: number[]; // [0..6] (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    dayOfMonth?: number; // 1..28
  };
  snoozedUntil?: string; // ISO datetime string for temporary snooze
  skipNextDate?: string; // "YYYY-MM-DD" — skip the next occurrence on this date (recurring only)
  createdAt: string;
}
