import { NotificationItem, useNotificationStore } from "@/store/notificationStore";
import { NotificationType, LectraNotification } from "./notificationTypes";
import { findNotificationMetadata } from "./registry";
import { format } from "date-fns";

export function addHistory(notification: NotificationItem) {
  useNotificationStore.getState().addNotification(notification);
}

function inferTypeFromTitle(title: string, fallbackType?: unknown): NotificationType {
  if (typeof fallbackType === "string" && isValidNotificationType(fallbackType)) {
    return fallbackType as NotificationType;
  }
  if (title.includes("Overdue")) {
    return "overdue";
  }
  if (title.includes("Due Today")) {
    return "deadline-today";
  }
  if (title.includes("Due Tomorrow")) {
    return "deadline-tomorrow";
  }
  if (title.includes("Weekly")) {
    return "weekly-summary";
  }
  return "custom-reminder";
}

function isValidNotificationType(type: string): boolean {
  return [
    "daily-reminder",
    "deadline-today",
    "deadline-tomorrow",
    "overdue",
    "weekly-summary",
    "custom-reminder",
  ].includes(type);
}

export function recordNotificationToHistory(payload: unknown, read = false) {
  if (!payload) return;

  const p = payload as Record<string, unknown>;

  const extra = (p["extra"] || (p["scheduledAt"] ? p : undefined)) as
    | LectraNotification
    | undefined;

  const rawTitle = String(extra?.title ?? p["title"] ?? "Notification");
  const rawBody = String(extra?.body ?? p["body"] ?? "");
  const nativeId = typeof p["id"] === "number" ? (p["id"] as number) : undefined;

  let baseId = extra?.id;
  let type = extra?.type;
  let entryId = extra?.entryId;
  let workId = extra?.workId;
  let isRecurring =
    baseId?.includes("-snoozed-")
      ? false
      : (extra?.customReminder?.type === "recurring" || type === "weekly-summary");

  // If extra is missing (e.g. from Android getDeliveredNotifications()), lookup metadata
  if (!baseId) {
    const meta = findNotificationMetadata(nativeId, rawTitle, rawBody);
    if (meta) {
      baseId = meta.id;
      type = meta.type;
      entryId = meta.entryId;
      workId = meta.workId;
      isRecurring = baseId.includes("-snoozed-") ? false : (meta.isRecurring || meta.type === "weekly-summary");
    }
  }

  if (!baseId) {
    baseId = typeof p["id"] === "string" ? (p["id"] as string) : `notif-${nativeId ?? Date.now()}`;
  }

  if (!type) {
    type = inferTypeFromTitle(rawTitle, p["type"]);
  }

  if (baseId.includes("-snoozed-")) {
    isRecurring = false;
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isRecurringOrDaily =
    isRecurring ||
    type === "weekly-summary" ||
    type === "overdue" ||
    type === "daily-reminder";

  const historyId =
    isRecurringOrDaily && !baseId.includes(todayStr)
      ? `${baseId}-${todayStr}`
      : baseId;

  // History conceptually represents: "Notification received at [date/time]"
  const createdAt = new Date().toISOString();

  addHistory({
    id: historyId,
    type,
    title: rawTitle,
    body: rawBody,
    createdAt,
    read,
    entryId,
    workId,
  });
}