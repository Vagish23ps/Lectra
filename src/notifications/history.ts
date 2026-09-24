import { NotificationItem, useNotificationStore } from "@/store/notificationStore";
import { NotificationType, LectraNotification } from "./notificationTypes";

export function addHistory(notification: NotificationItem) {
  useNotificationStore.getState().addNotification(notification);
}

export function recordNotificationToHistory(payload: unknown, read = false) {
  if (!payload) return;

  const p = payload as Record<string, unknown>;

  const extra = (p["extra"] || (p["scheduledAt"] ? p : undefined)) as
    | LectraNotification
    | undefined;

  const title = String(extra?.title ?? p["title"] ?? "Notification");
  const body = String(extra?.body ?? p["body"] ?? "");

  let type: NotificationType = "custom-reminder";
  if (extra?.type) {
    type = extra.type;
  } else if (p["type"]) {
    type = p["type"] as NotificationType;
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
    type === "weekly-summary";

  const todayStr = new Date().toISOString().slice(0, 10);
  const baseId = String(extra?.id ?? p["id"] ?? `notif-${Date.now()}`);
  const id = isRecurring && !baseId.includes(todayStr)
    ? `${baseId}-${todayStr}`
    : baseId;

  let createdAt: string;
  if (extra?.createdAt) {
    createdAt = typeof extra.createdAt === "number"
      ? new Date(extra.createdAt).toISOString()
      : String(extra.createdAt);
  } else if (p["createdAt"]) {
    createdAt = typeof p["createdAt"] === "number"
      ? new Date(p["createdAt"]).toISOString()
      : String(p["createdAt"]);
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
    entryId: extra?.entryId,
    workId: extra?.workId,
  });
}