import { Entry } from "@/types/entry";

import { runNotificationScheduler } from "./scheduler";

class NotificationService {
  private initialized = false;

  async initialize(entries: Entry[]) {
    if (this.initialized) return;

    this.initialized = true;

    await runNotificationScheduler(entries);
  }

  async refresh(entries: Entry[]) {
    await runNotificationScheduler(entries);
  }
}

export const notificationService = new NotificationService();