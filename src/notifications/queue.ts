import { LectraNotification } from "./notificationTypes";

class NotificationQueue {
  private queue: LectraNotification[] = [];

  add(notification: LectraNotification) {
    this.queue.push(notification);
  }

  addMany(notifications: LectraNotification[]) {
    this.queue.push(...notifications);
  }

  getAll() {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
  }

  size() {
    return this.queue.length;
  }

  hasItems() {
    return this.queue.length > 0;
  }
}

export const notificationQueue = new NotificationQueue();