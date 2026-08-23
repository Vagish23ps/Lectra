import { CustomReminder } from "@/types/reminder";

export type NotificationType =
  | "daily-reminder"
  | "deadline-today"
  | "deadline-tomorrow"
  | "overdue"
  | "weekly-summary"
  | "custom-reminder";

export type NotificationPriority = "low" | "normal" | "high";

export interface LectraNotification {
  id: string;

  type: NotificationType;

  title: string;

  body: string;

  scheduledAt: number;

  priority: NotificationPriority;

  entryId?: string;

  workId?: string;

  customReminder?: CustomReminder;

  read: boolean;

  createdAt: number;
}