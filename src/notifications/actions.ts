import { LectraNotification } from "./notificationTypes";
import { useEntryStore } from "@/store/entryStore";

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
          /^(overdue|deadline-today|deadline-tomorrow|custom-task|custom-task-daily|custom-task-weekly|custom-task-day|custom-task-monthly)-/,
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
    window.location.href = `/?viewEntry=${targetEntryId}${workParam}`;
    return;
  }

  switch (notification.type) {
    case "deadline-today":
    case "deadline-tomorrow":
    case "overdue":
      window.location.href = "/pending";
      break;

    case "weekly-summary":
    default:
      window.location.href = "/";
      break;
  }
}