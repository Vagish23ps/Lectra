import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resetNotification } from "@/src/notifications/storage";
import { notificationService } from "@/src/notifications/service";
import { useEntryStore } from "./entryStore";

export interface NotificationSettings {
  enabled: boolean;

  dailyReminder: boolean;
  dailyReminderEnabled?: boolean;
  dailyReminderTime: string;

  overdueReminder: boolean;
  overdueEnabled?: boolean;
  overdueReminderTime: string;

  dueTodayReminder: boolean;
  dueTodayEnabled?: boolean;
  dueTodayReminderTime: string;

  dueTomorrowReminder: boolean;
  dueTomorrowEnabled?: boolean;
  dueTomorrowReminderTime: string;

  weeklySummary: boolean;
  weeklySummaryEnabled?: boolean;
  weeklySummaryTime: string;
  weeklySummaryDay: string;

  customReminders: boolean;
  customRemindersEnabled?: boolean;

  setSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => void;
}

export const useNotificationSettingsStore = create<NotificationSettings>()(
  persist(
    (set) => ({
      enabled: true,

      dailyReminder: true,
      dailyReminderEnabled: true,
      dailyReminderTime: "20:00",

      overdueReminder: true,
      overdueEnabled: true,
      overdueReminderTime: "07:30",

      dueTodayReminder: true,
      dueTodayEnabled: true,
      dueTodayReminderTime: "08:00",

      dueTomorrowReminder: true,
      dueTomorrowEnabled: true,
      dueTomorrowReminderTime: "17:00",

      weeklySummary: true,
      weeklySummaryEnabled: true,
      weeklySummaryTime: "19:00",
      weeklySummaryDay: "6",

      customReminders: true,
      customRemindersEnabled: true,

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
          case "weeklySummaryDay":
            resetNotification("weekly-summary");
            break;
        }

        set((state) => {
          const updates: Partial<NotificationSettings> = {
            [key]: value,
          };

          // Synchronize alias properties
          if (key === "dailyReminder") updates.dailyReminderEnabled = value as boolean;
          if (key === "dailyReminderEnabled") updates.dailyReminder = value as boolean;

          if (key === "overdueReminder") updates.overdueEnabled = value as boolean;
          if (key === "overdueEnabled") updates.overdueReminder = value as boolean;

          if (key === "dueTodayReminder") updates.dueTodayEnabled = value as boolean;
          if (key === "dueTodayEnabled") updates.dueTodayReminder = value as boolean;

          if (key === "dueTomorrowReminder") updates.dueTomorrowEnabled = value as boolean;
          if (key === "dueTomorrowEnabled") updates.dueTomorrowReminder = value as boolean;

          if (key === "weeklySummary") updates.weeklySummaryEnabled = value as boolean;
          if (key === "weeklySummaryEnabled") updates.weeklySummary = value as boolean;

          if (key === "customReminders") updates.customRemindersEnabled = value as boolean;
          if (key === "customRemindersEnabled") updates.customReminders = value as boolean;

          return {
            ...state,
            ...updates,
          };
        });

        const entries = useEntryStore.getState().entries;
        void notificationService.refresh(entries);
      },
    }),
    {
      name: "lectra-notification-settings",
    },
  ),
);
