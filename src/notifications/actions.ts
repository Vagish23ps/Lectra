import { LectraNotification } from "./notificationTypes";
import { useEntryStore } from "@/store/entryStore";
import { useNotificationStore } from "@/store/notificationStore";
import { findNotificationMetadata } from "./registry";
import { Entry } from "@/types/entry";
import { toast } from "sonner";
import { format } from "date-fns";

let appRouterNavigate: ((url: string) => void) | null = null;

export function registerAppNavigation(navigateFn: (url: string) => void) {
  appRouterNavigate = navigateFn;
}

export function navigateToUrl(relativeUrl: string) {
  if (typeof window !== "undefined") {
    try {
      window.history.pushState({}, "", relativeUrl);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {}
  }
  if (appRouterNavigate) {
    appRouterNavigate(relativeUrl);
    return;
  }
  if (typeof window !== "undefined") {
    const url = new URL(relativeUrl, window.location.origin);
    window.location.href = url.href;
  }
}

async function ensureEntryStoreHydrated() {
  const store = useEntryStore.getState();
  if (store.hydrated && store.entries.length > 0) return store;

  // Wait briefly for Zustand persist to finish rehydration
  for (let i = 0; i < 8; i++) {
    if (useEntryStore.getState().hydrated && useEntryStore.getState().entries.length > 0) {
      return useEntryStore.getState();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("lectra-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state?.entries && Array.isArray(parsed.state.entries)) {
          useEntryStore.setState({ entries: parsed.state.entries, hydrated: true });
        }
      }
    } catch {}
  }
  return useEntryStore.getState();
}

export function handleNotificationClick(
  notification: LectraNotification
) {
  let targetEntryId = notification.entryId;
  let targetWorkId = notification.workId;

  if (!targetEntryId) {
    const { entries } = useEntryStore.getState();
    const rawWorkId =
      notification.workId ||
      notification.id
        .replace(
          /^(overdue|deadline-today|deadline-tomorrow|custom-task|custom-task-snoozed|custom-task-daily|custom-task-weekly|custom-task-day|custom-task-monthly)-/,
          ""
        )
        .split("-")[0];

    for (const entry of entries) {
      const work = entry.works.find((w) => w.id === rawWorkId);
      if (work) {
        targetEntryId = entry.id;
        targetWorkId = work.id;
        break;
      }
      if (
        (entry.entryName && notification.body.includes(entry.entryName)) ||
        (entry.subject && notification.body.includes(entry.subject))
      ) {
        targetEntryId = entry.id;
        break;
      }
      const matchWork = entry.works.find(
        (w) => w.task && notification.body.includes(w.task)
      );
      if (matchWork) {
        targetEntryId = entry.id;
        targetWorkId = matchWork.id;
        break;
      }
    }
  }

  if (targetEntryId) {
    const workParam = targetWorkId ? `&workId=${targetWorkId}` : "";
    navigateToUrl(`/?viewEntry=${targetEntryId}${workParam}`);
    return;
  }

  switch (notification.type) {
    case "deadline-today":
    case "deadline-tomorrow":
    case "overdue":
      navigateToUrl("/pending");
      break;

    case "weekly-summary":
    default:
      navigateToUrl("/");
      break;
  }
}

export interface NotificationActionTargetMeta {
  id: string;
  type: string;
  entryId?: string;
  workId?: string;
  reminderId?: string;
  notificationCategory?: "task" | "active-reminder";
}

export async function handleNotificationActionRouting(
  actionId: string,
  notificationPayload: {
    id: number;
    title?: string;
    body?: string;
    extra?: unknown;
  }
) {
  const extra = notificationPayload.extra as
    | (LectraNotification & Record<string, unknown>)
    | undefined;

  const nativeId = notificationPayload.id;
  const rawTitle = String(extra?.title ?? notificationPayload.title ?? "");
  const rawBody = String(extra?.body ?? notificationPayload.body ?? "");

  // Resolve metadata: first from extra, then from registry lookup
  let meta: NotificationActionTargetMeta | null = extra
    ? {
        id: extra.id,
        type: extra.type,
        entryId: extra.entryId,
        workId: extra.workId,
        reminderId:
          extra.customReminder?.id || (extra["reminderId"] as string | undefined),
        notificationCategory:
          (extra["notificationCategory"] as "task" | "active-reminder" | undefined) ||
          (extra.type === "deadline-today" ||
          extra.type === "deadline-tomorrow" ||
          extra.type === "overdue"
            ? "task"
            : "active-reminder"),
      }
    : null;

  if (!meta) {
    const found = findNotificationMetadata(nativeId, rawTitle, rawBody);
    if (found) {
      meta = {
        id: found.id,
        type: found.type,
        entryId: found.entryId,
        workId: found.workId,
        reminderId: found.reminderId,
        notificationCategory:
          found.type === "deadline-today" ||
          found.type === "deadline-tomorrow" ||
          found.type === "overdue"
            ? "task"
            : "active-reminder",
      };
    }
  }

  // Remove delivered notification from Android status bar on any explicit action tap
  if (typeof window !== "undefined") {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.removeDeliveredNotifications({
        notifications: [{ id: nativeId, title: "", body: "" }],
      }).catch(() => {});
    } catch {
      // Ignore on web
    }
  }

  if (actionId === "complete") {
    await executeCompleteAction(meta);
    return;
  }

  if (actionId === "stop") {
    await executeStopAction(meta);
    return;
  }

  if (actionId === "remind") {
    await executeRemindAction(meta);
    return;
  }

  // Default / body tap action
  if (extra) {
    handleNotificationClick(extra);
  } else if (meta?.entryId) {
    const workParam = meta.workId ? `&workId=${meta.workId}` : "";
    navigateToUrl(`/?viewEntry=${meta.entryId}${workParam}`);
  } else {
    navigateToUrl("/");
  }
}

async function executeCompleteAction(
  meta: NotificationActionTargetMeta | null
) {
  await ensureEntryStoreHydrated();
  const { entries, updateEntry } = useEntryStore.getState();
  let targetEntryId = meta?.entryId;
  let targetWorkId = meta?.workId;

  if (!targetWorkId && meta?.id) {
    targetWorkId = meta.id
      .replace(
        /^(overdue|deadline-today|deadline-tomorrow|custom-task|custom-task-snoozed|custom-task-daily|custom-task-weekly|custom-task-day|custom-task-monthly)-/,
        ""
      )
      .split("-")[0];
  }

  let entry = entries.find((e) => e.id === targetEntryId);

  if (!targetEntryId && targetWorkId) {
    for (const e of entries) {
      const match = e.works.find((w) => w.id === targetWorkId);
      if (match) {
        targetEntryId = e.id;
        entry = e;
        break;
      }
    }
  }

  if (targetEntryId && targetWorkId) {
    const work = entry?.works.find((w) => w.id === targetWorkId);

    // Prevent duplicate completion
    if (entry && work && !work.completed) {
      const updatedEntry: Entry = {
        ...entry,
        works: entry.works.map((w) =>
          w.id === targetWorkId ? { ...w, completed: true } : w
        ),
      };
      updateEntry(updatedEntry);
      toast.success("Task completed");
    }
  }

  // Update history record
  if (meta?.id) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const historyId = meta.id.includes(todayStr) ? meta.id : `${meta.id}-${todayStr}`;
    useNotificationStore.getState().setActionTaken(meta.id, "completed");
    useNotificationStore.getState().setActionTaken(historyId, "completed");
    useNotificationStore.getState().markAsRead(meta.id);
    useNotificationStore.getState().markAsRead(historyId);
  }
}

async function executeStopAction(
  meta: NotificationActionTargetMeta | null
) {
  await ensureEntryStoreHydrated();
  const { entries, updateReminder } = useEntryStore.getState();
  let targetEntryId = meta?.entryId;
  let targetWorkId = meta?.workId;
  const reminderId = meta?.reminderId;

  if (!targetEntryId && reminderId) {
    for (const entry of entries) {
      if (entry.reminder?.id === reminderId) {
        targetEntryId = entry.id;
        break;
      }
      const matchWork = entry.works.find((w) => w.reminder?.id === reminderId);
      if (matchWork) {
        targetEntryId = entry.id;
        targetWorkId = matchWork.id;
        break;
      }
    }
  }

  if (targetEntryId) {
    updateReminder(targetEntryId, targetWorkId || null, undefined);
    toast.success("Reminder stopped");
  }

  // Update history record
  if (meta?.id) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const historyId = meta.id.includes(todayStr) ? meta.id : `${meta.id}-${todayStr}`;
    useNotificationStore.getState().setActionTaken(meta.id, "stopped");
    useNotificationStore.getState().setActionTaken(historyId, "stopped");
    useNotificationStore.getState().markAsRead(meta.id);
    useNotificationStore.getState().markAsRead(historyId);
  }

  navigateToUrl("/notifications?tab=reminders");
}

async function executeRemindAction(
  meta: NotificationActionTargetMeta | null
) {
  await ensureEntryStoreHydrated();
  const { entries, updateReminder } = useEntryStore.getState();

  const isTaskNotification =
    meta?.notificationCategory === "task" ||
    meta?.type === "deadline-today" ||
    meta?.type === "deadline-tomorrow" ||
    meta?.type === "overdue" ||
    (!meta?.reminderId && !!meta?.workId);

  let targetEntryId = meta?.entryId;
  let targetWorkId = meta?.workId;
  let reminderId = meta?.reminderId;

  if (isTaskNotification) {
    if (!targetWorkId && meta?.id) {
      targetWorkId = meta.id
        .replace(
          /^(overdue|deadline-today|deadline-tomorrow|custom-task|custom-task-snoozed|custom-task-daily|custom-task-weekly|custom-task-day|custom-task-monthly)-/,
          ""
        )
        .split("-")[0];
    }

    if (!targetEntryId && targetWorkId) {
      for (const e of entries) {
        const match = e.works.find((w) => w.id === targetWorkId);
        if (match) {
          targetEntryId = e.id;
          break;
        }
      }
    }

    if (targetEntryId && targetWorkId) {
      const entry = entries.find((e) => e.id === targetEntryId);
      const work = entry?.works.find((w) => w.id === targetWorkId);

      if (work) {
        let reminder = work.reminder;
        if (!reminder) {
          // If task does not already have an active reminder, create and associate one
          reminder = {
            id: crypto.randomUUID(),
            name: work.task.trim() || "Task Reminder",
            enabled: true,
            type: "one-time",
            time: format(new Date(), "HH:mm"),
            date: format(new Date(), "yyyy-MM-dd"),
            createdAt: new Date().toISOString(),
          };
          updateReminder(targetEntryId, targetWorkId, reminder);
        }
        reminderId = reminder.id;
      }
    }
  }

  // Update history record
  if (meta?.id) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const historyId = meta.id.includes(todayStr) ? meta.id : `${meta.id}-${todayStr}`;
    useNotificationStore.getState().setActionTaken(meta.id, "reminded");
    useNotificationStore.getState().setActionTaken(historyId, "reminded");
    useNotificationStore.getState().markAsRead(meta.id);
    useNotificationStore.getState().markAsRead(historyId);
  }

  // Route to the existing active-reminder snooze/timing flow
  const reminderParam = reminderId ? `&snoozeReminderId=${reminderId}` : "";
  const entryParam = targetEntryId ? `&entryId=${targetEntryId}` : "";
  const workParam = targetWorkId ? `&workId=${targetWorkId}` : "";
  navigateToUrl(`/notifications?tab=reminders${reminderParam}${entryParam}${workParam}`);
}