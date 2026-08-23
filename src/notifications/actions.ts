import { LectraNotification } from "./notificationTypes";

export function handleNotificationClick(
  notification: LectraNotification
) {
  if (notification.entryId) {
    const workParam = notification.workId ? `&workId=${notification.workId}` : "";
    window.location.href = `/?viewEntry=${notification.entryId}${workParam}`;
    return;
  }

  switch (notification.type) {
    case "daily-reminder":
      window.location.href = "/";
      break;

    case "deadline-today":
    case "deadline-tomorrow":
    case "overdue":
      window.location.href = "/pending";
      break;

    case "weekly-summary":
      window.location.href = "/";
      break;
    default:
      window.location.href = "/";
      break;
  }
}