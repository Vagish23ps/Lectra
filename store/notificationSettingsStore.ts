import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resetNotification } from "@/src/notifications/storage";

interface NotificationSettings {
  enabled: boolean;

  dailyReminder: boolean;
  dailyReminderTime: string;

  overdueReminder: boolean;
  overdueReminderTime: string;

  dueTodayReminder: boolean;
  dueTodayReminderTime: string;

  dueTomorrowReminder: boolean;
  dueTomorrowReminderTime: string;

  weeklySummary: boolean;
  weeklySummaryTime: string;
  weeklySummaryDay: string;

  setSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void;
}

export const useNotificationSettingsStore =
  create<NotificationSettings>()(
    persist(
      (set) => ({
        enabled: true,

        dailyReminder: true,
        dailyReminderTime: "20:00",

        overdueReminder: true,
        overdueReminderTime: "08:00",

        dueTodayReminder: true,
        dueTodayReminderTime: "09:00",

        dueTomorrowReminder: true,
        dueTomorrowReminderTime: "18:00",

        weeklySummary: true,
        weeklySummaryTime: "19:00",
        weeklySummaryDay: "0",
        setSetting: (key, value) => {
  // Reset today's shown notification if its reminder time changes
  switch (key) {
    case "dailyReminderTime":
      resetNotification("daily-reminder");
      break;

    case "overdueReminderTime":
      resetNotification("overdue");
      break;

    case "dueTodayReminderTime":
      resetNotification("deadline-today");
      break;

    case "dueTomorrowReminderTime":
      resetNotification("deadline-tomorrow");
      break;

    case "weeklySummaryTime":
      resetNotification("weekly-summary");
      break;
    
    case "weeklySummaryDay":
      resetNotification("weekly-summary");
      break;
  }

  set((state) => ({
    ...state,
    [key]: value,
  }));
},
      }),
      {
        name: "lectra-notification-settings",
      }
    )
  );