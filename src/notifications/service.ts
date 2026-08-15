import { Entry } from "@/types/entry";
import { runNotificationScheduler } from "./scheduler";
import { requestNotificationPermission } from "./permission";

class NotificationService {
  private initialized = false;
  private permissionGranted = false;

  async initialize(entries: Entry[]) {
    console.log("🔔 NOTIFICATION INIT START", entries.length);

    if (this.initialized) {
      console.log("🔔 NOTIFICATION ALREADY INITIALIZED");
      return;
    }

    const permission = await requestNotificationPermission();

    console.log("🔔 NOTIFICATION PERMISSION:", permission);

    if (permission !== "granted") {
      console.log("🔔 NOTIFICATION PERMISSION DENIED");
      this.initialized = true;
      return;
    }

    this.permissionGranted = true;
    this.initialized = true;

    console.log("🔔 RUNNING NOTIFICATION SCHEDULER");

    await runNotificationScheduler(entries);

    console.log("🔔 NOTIFICATION INIT COMPLETE");
  }

  async refresh(entries: Entry[]) {
    console.log(
      "🔔 NOTIFICATION REFRESH",
      entries.length,
      this.initialized,
      this.permissionGranted,
    );

    if (!this.initialized || !this.permissionGranted) return;

    await runNotificationScheduler(entries);
  }
}
export const notificationService = new NotificationService();
