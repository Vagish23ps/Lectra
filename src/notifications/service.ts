import { Entry } from "@/types/entry";
import { runNotificationScheduler } from "./scheduler";
import { requestNotificationPermission } from "./permission";

class NotificationService {
  private initialized = false;
  private permissionGranted = false;

  async initialize(entries: Entry[]) {
    if (this.initialized) {
      return;
    }

    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      this.initialized = true;
      return;
    }

    this.permissionGranted = true;
    this.initialized = true;

    await runNotificationScheduler(entries);
  }

  async refresh(entries: Entry[]) {
    if (!this.initialized || !this.permissionGranted) return;

    await runNotificationScheduler(entries);
  }
}
export const notificationService = new NotificationService();
