export type ReminderFrequency = "daily" | "weekly" | "monthly" | "selected-days";

export interface CustomReminder {
  id: string;
  enabled: boolean;
  time: string; // "HH:MM" 24-hour format
  type: "one-time" | "recurring";
  date?: string; // "YYYY-MM-DD" for one-time reminders
  recurrence?: {
    frequency: ReminderFrequency;
    daysOfWeek?: number[]; // [0..6] (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    dayOfMonth?: number; // 1..28
  };
  createdAt: string;
}
