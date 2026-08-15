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

  const id = String(extra?.id ?? payload.id ?? `notif-${Date.now()}`);
  const type = (extra?.type ?? payload.type ?? "daily-reminder") as NotificationType;
  const title = extra?.title ?? payload.title ?? "Notification";
  const body = extra?.body ?? payload.body ?? "";

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