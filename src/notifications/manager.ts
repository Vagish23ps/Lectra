import { LectraNotification } from "./notificationTypes";

export class NotificationManager {
  private notifications: LectraNotification[];

  constructor(notifications: LectraNotification[]) {
    this.notifications = notifications;
  }

  getAll() {
    return this.notifications;
  }

  getHighPriority() {
    return this.notifications.filter(
      (notification) => notification.priority === "high"
    );
  }

  getNormalPriority() {
    return this.notifications.filter(
      (notification) => notification.priority === "normal"
    );
  }

  getLowPriority() {
    return this.notifications.filter(
      (notification) => notification.priority === "low"
    );
  }
}