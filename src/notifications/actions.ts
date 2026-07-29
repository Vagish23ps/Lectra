import { LectraNotification } from "./notificationTypes";

export function handleNotificationClick(
  notification: LectraNotification
) {
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
  }
}