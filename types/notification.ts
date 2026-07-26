export type NotificationType =
  | "deadline"
  | "upcoming"
  | "daily-note"
  | "morning"
  | "evening"
  | "completed"
  | "overdue"
  | "system";

export type NotificationPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface NotificationItem {
  id: string;

  title: string;

  message: string;

  type: NotificationType;

  priority: NotificationPriority;

  read: boolean;

  createdAt: string;

  actionUrl?: string;
}