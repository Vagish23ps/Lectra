import { LectraNotification, NotificationType } from "./notificationTypes";
import { getNotificationNativeId } from "./ids";
import { Entry } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";

export interface NotificationRegistryEntry {
  nativeId: number;
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entryId?: string;
  workId?: string;
  reminderId?: string;
  isRecurring?: boolean;
}

const REGISTRY_STORAGE_KEY = "lectra_notification_registry";

export function saveNotificationRegistry(notifications: LectraNotification[]) {
  if (typeof window === "undefined") return;

  const registry: Record<number, NotificationRegistryEntry> = {};

  for (const notif of notifications) {
    const nativeId = getNotificationNativeId(notif.id);
    const isRecurring =
      notif.id.includes("-snoozed-")
        ? false
        : notif.customReminder?.type === "recurring" ||
          notif.type === "weekly-summary";

    registry[nativeId] = {
      nativeId,
      id: notif.id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      entryId: notif.entryId,
      workId: notif.workId,
      reminderId: notif.customReminder?.id,
      isRecurring,
    };
  }

  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota errors
  }
}

export function getRegistryEntries(): Record<number, NotificationRegistryEntry> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function findNotificationMetadata(
  nativeId?: number,
  title?: string,
  body?: string
): NotificationRegistryEntry | null {
  const registry = getRegistryEntries();

  if (nativeId !== undefined && registry[nativeId]) {
    return registry[nativeId];
  }

  // Fallback by title & body in registry
  if (title || body) {
    for (const entry of Object.values(registry)) {
      if (title && entry.title === title && body && entry.body === body) {
        return entry;
      }
    }
  }

  // Dynamic fallback from current entryStore
  if (typeof window !== "undefined") {
    const { entries } = useEntryStore.getState();
    return findMetadataFromEntries(entries, nativeId, title, body);
  }

  return null;
}

function findMetadataFromEntries(
  entries: Entry[],
  nativeId?: number,
  title?: string,
  body?: string
): NotificationRegistryEntry | null {
  for (const entry of entries) {
    // Check entry-level reminder
    if (entry.reminder) {
      const entryId = entry.id;
      const candidateIds = [
        `custom-entry-${entryId}`,
        `custom-entry-snoozed-${entryId}`,
        `custom-entry-daily-${entryId}`,
        `custom-entry-monthly-${entryId}`,
        ...[0, 1, 2, 3, 4, 5, 6].map((d) => `custom-entry-weekly-${entryId}-${d}`),
        ...[0, 1, 2, 3, 4, 5, 6].map((d) => `custom-entry-day-${entryId}-${d}`),
      ];
      const matchId =
        nativeId !== undefined
          ? candidateIds.find((id) => getNotificationNativeId(id) === nativeId)
          : undefined;

      if (
        matchId ||
        (title && entry.reminder.name === title) ||
        (body && (entry.entryName.includes(body) || entry.subject.includes(body)))
      ) {
        const selectedId = matchId || `custom-entry-${entryId}`;
        return {
          nativeId: getNotificationNativeId(selectedId),
          id: selectedId,
          type: "custom-reminder",
          title: title || entry.reminder.name || "Reminder",
          body: body || entry.entryName || entry.subject,
          entryId: entry.id,
          reminderId: entry.reminder.id,
          isRecurring: selectedId.includes("-snoozed-") ? false : entry.reminder.type === "recurring",
        };
      }
    }

    // Check works
    for (const work of entry.works) {
      // Check task reminder
      if (work.reminder) {
        const candidateIds = [
          `custom-task-${work.id}`,
          `custom-task-snoozed-${work.id}`,
          `custom-task-daily-${work.id}`,
          `custom-task-monthly-${work.id}`,
          ...[0, 1, 2, 3, 4, 5, 6].map((d) => `custom-task-weekly-${work.id}-${d}`),
          ...[0, 1, 2, 3, 4, 5, 6].map((d) => `custom-task-day-${work.id}-${d}`),
        ];
        const matchId =
          nativeId !== undefined
            ? candidateIds.find((id) => getNotificationNativeId(id) === nativeId)
            : undefined;

        if (
          matchId ||
          (body && body.includes(work.task))
        ) {
          const selectedId = matchId || `custom-task-${work.id}`;
          return {
            nativeId: getNotificationNativeId(selectedId),
            id: selectedId,
            type: "custom-reminder",
            title: title || work.reminder.name || "Task Reminder",
            body: body || work.task,
            entryId: entry.id,
            workId: work.id,
            reminderId: work.reminder.id,
            isRecurring: selectedId.includes("-snoozed-") ? false : work.reminder.type === "recurring",
          };
        }
      }

      // Check deadline notifications
      const deadlineTodayId = `deadline-today-${work.id}`;
      const deadlineTomorrowId = `deadline-tomorrow-${work.id}`;
      const overdueId = `overdue-${work.id}`;

      if (nativeId !== undefined) {
        if (nativeId === getNotificationNativeId(deadlineTodayId)) {
          return {
            nativeId,
            id: deadlineTodayId,
            type: "deadline-today",
            title: title || "Due Today",
            body: body || work.task,
            entryId: entry.id,
            workId: work.id,
          };
        }
        if (nativeId === getNotificationNativeId(deadlineTomorrowId)) {
          return {
            nativeId,
            id: deadlineTomorrowId,
            type: "deadline-tomorrow",
            title: title || "Due Tomorrow",
            body: body || work.task,
            entryId: entry.id,
            workId: work.id,
          };
        }
        if (nativeId === getNotificationNativeId(overdueId)) {
          return {
            nativeId,
            id: overdueId,
            type: "overdue",
            title: title || "Overdue Task",
            body: body || work.task,
            entryId: entry.id,
            workId: work.id,
          };
        }
      }

      if (body && work.task && body.includes(work.task)) {
        let type: NotificationType = "deadline-today";
        let notifId = deadlineTodayId;
        if (title?.includes("Tomorrow")) {
          type = "deadline-tomorrow";
          notifId = deadlineTomorrowId;
        } else if (title?.includes("Overdue")) {
          type = "overdue";
          notifId = overdueId;
        }

        return {
          nativeId: getNotificationNativeId(notifId),
          id: notifId,
          type,
          title: title || "Due Today",
          body,
          entryId: entry.id,
          workId: work.id,
        };
      }
    }
  }

  return null;
}
