export type NotificationType =
  | "daily-reminder"
  | "deadline-today"
  | "deadline-tomorrow"
  | "overdue"
  | "weekly-summary";

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

  read: boolean;

  createdAt: number;
}