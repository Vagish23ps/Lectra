import { NotificationItem, useNotificationStore } from "@/store/notificationStore";
import { LectraNotification, NotificationType } from "./notificationTypes";

export function addHistory(
  notification: NotificationItem
) {
  useNotificationStore
    .getState()
    .addNotification(notification);
}

export function recordNotificationToHistory(
  payload: any,
  read = false
) {
  if (!payload) return;

  const extra = payload.extra as LectraNotification | undefined;

  const title = extra?.title ?? payload.title ?? "Notification";
  const body = extra?.body ?? payload.body ?? "";

  let type: NotificationType = "daily-reminder";
  if (extra?.type) {
    type = extra.type;
  } else if (payload.type) {
    type = payload.type;
  } else if (title.includes("Overdue")) {
    type = "overdue";
  } else if (title.includes("Due Today")) {
    type = "deadline-today";
  } else if (title.includes("Due Tomorrow")) {
    type = "deadline-tomorrow";
  } else if (title.includes("Weekly")) {
    type = "weekly-summary";
  } else if (title.includes("Reminder")) {
    type = "custom-reminder";
  }

  const isRecurring =
    extra?.customReminder?.type === "recurring" ||
    type === "daily-reminder" ||
    type === "weekly-summary";

  const todayStr = new Date().toISOString().slice(0, 10);
  const baseId = String(extra?.id ?? payload.id ?? `notif-${Date.now()}`);
  const id = isRecurring && !baseId.includes(todayStr)
    ? `${baseId}-${todayStr}`
    : baseId;

  let createdAt: string;
  if (extra?.createdAt) {
    createdAt = typeof extra.createdAt === "number" ? new Date(extra.createdAt).toISOString() : String(extra.createdAt);
  } else if (payload.createdAt) {
    createdAt = typeof payload.createdAt === "number" ? new Date(payload.createdAt).toISOString() : String(payload.createdAt);
  } else {
    createdAt = new Date().toISOString();
  }

  addHistory({
    id,
    type,
    title,
    body,
    createdAt,
    read,
  });
}