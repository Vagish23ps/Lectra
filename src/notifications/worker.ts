import { useEntryStore } from "@/store/entryStore";
import { notificationService } from "./service";

class NotificationWorker {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  private run() {
    const entries = useEntryStore.getState().entries;
    notificationService.refresh(entries);
  }

  start() {
    if (this.intervalId || this.timeoutId) return;

    this.run();

    const now = new Date();

    const delay =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    this.timeoutId = setTimeout(() => {
      this.run();

      this.intervalId = setInterval(() => {
        this.run();
      }, 60 * 1000);

      this.timeoutId = null;
    }, delay);
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning() {
    return this.intervalId !== null || this.timeoutId !== null;
  }
}

export const notificationWorker = new NotificationWorker();