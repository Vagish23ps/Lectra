import { Entry } from "@/types/entry";
import { runNotificationScheduler } from "./scheduler";
import { requestNotificationPermission } from "./permission";

class NotificationService {
  private initialized = false;
  private permissionGranted = false;
  private isRunning = false;
  private pendingEntries: Entry[] | null = null;

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

    await this.refresh(entries);
  }

  async refresh(entries: Entry[]) {
    if (!this.initialized || !this.permissionGranted) return;

    if (this.isRunning) {
      // Queue latest entries to run once current reconciliation cycle completes
      this.pendingEntries = entries;
      return;
    }

    this.isRunning = true;
    try {
      await runNotificationScheduler(entries);
    } finally {
      this.isRunning = false;
      if (this.pendingEntries) {
        const nextEntries = this.pendingEntries;
        this.pendingEntries = null;
        void this.refresh(nextEntries);
      }
    }
  }
}
export const notificationService = new NotificationService();
