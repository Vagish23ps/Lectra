"use client";

import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const settings = useNotificationSettingsStore();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <div className="flex items-center gap-3">
        <button
        onClick={() => router.back()}
        className="mr-2 rounded-full p-2 hover:bg-secondary"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Notification Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customize how Lectra reminds you about your work and deadlines.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Enable Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Turn all notifications on or off.
            </p>
          </div>

          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) =>
              settings.setSetting("enabled", e.target.checked)
            }
            className="h-5 w-5 shrink-0 accent-primary"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className={`rounded-2xl border border-border bg-card p-5 ${!settings.enabled ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium">Daily Reminder</label>

            <input
              type="checkbox"
              checked={settings.dailyReminder}
              disabled={!settings.enabled}
              onChange={(e) =>
                settings.setSetting("dailyReminder", e.target.checked)
              }
              className="h-5 w-5 accent-primary"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Reminder Time</span>
            <input
              type="time"
              disabled={!settings.enabled || !settings.dailyReminder}
              value={settings.dailyReminderTime}
              onChange={(e) =>
                settings.setSetting("dailyReminderTime", e.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className={`rounded-2xl border border-border bg-card p-5 ${!settings.enabled ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium">Overdue Reminder</label>

            <input
              type="checkbox"
              checked={settings.overdueReminder}
              disabled={!settings.enabled}
              onChange={(e) =>
                settings.setSetting("overdueReminder", e.target.checked)
              }
              className="h-5 w-5 accent-primary"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Reminder Time</span>
            <input
              type="time"
              disabled={!settings.enabled || !settings.overdueReminder}
              value={settings.overdueReminderTime}
              onChange={(e) =>
                settings.setSetting("overdueReminderTime", e.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className={`rounded-2xl border border-border bg-card p-5 ${!settings.enabled ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium">Due Today Reminder</label>

            <input
              type="checkbox"
              checked={settings.dueTodayReminder}
              disabled={!settings.enabled}
              onChange={(e) =>
                settings.setSetting("dueTodayReminder", e.target.checked)
              }
              className="h-5 w-5 accent-primary"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Reminder Time</span>
            <input
              type="time"
              disabled={!settings.enabled || !settings.dueTodayReminder}
              value={settings.dueTodayReminderTime}
              onChange={(e) =>
                settings.setSetting("dueTodayReminderTime", e.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className={`rounded-2xl border border-border bg-card p-5 ${!settings.enabled ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium">Due Tomorrow Reminder</label>

            <input
              type="checkbox"
              checked={settings.dueTomorrowReminder}
              disabled={!settings.enabled}
              onChange={(e) =>
                settings.setSetting("dueTomorrowReminder", e.target.checked)
              }
              className="h-5 w-5 accent-primary"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Reminder Time</span>
            <input
              type="time"
              disabled={!settings.enabled || !settings.dueTomorrowReminder}
              value={settings.dueTomorrowReminderTime}
              onChange={(e) =>
                settings.setSetting("dueTomorrowReminderTime", e.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className={`rounded-2xl border border-border bg-card p-5 ${!settings.enabled ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium">Weekly Summary</label>

            <input
              type="checkbox"
              checked={settings.weeklySummary}
              disabled={!settings.enabled}
              onChange={(e) =>
                settings.setSetting("weeklySummary", e.target.checked)
              }
              className="h-5 w-5 accent-primary"
            />
          </div>

          

          <div className="mt-4 flex items-center justify-between gap-4">
  <span className="text-sm text-muted-foreground">Reminder Time</span>

  <input
    type="time"
    disabled={!settings.enabled || !settings.weeklySummary}
    value={settings.weeklySummaryTime}
    onChange={(e) =>
      settings.setSetting("weeklySummaryTime", e.target.value)
    }
    className="rounded-lg border border-border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
  />
</div>

<div className="mt-4 flex items-center justify-between gap-4">
  <span className="text-sm text-muted-foreground">Summary Day</span>

  <select
    disabled={!settings.enabled || !settings.weeklySummary}
    value={settings.weeklySummaryDay}
    onChange={(e) =>
      settings.setSetting("weeklySummaryDay", e.target.value)
    }
    className="rounded-lg border border-border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <option value="0">Sunday</option>
    <option value="1">Monday</option>
    <option value="2">Tuesday</option>
    <option value="3">Wednesday</option>
    <option value="4">Thursday</option>
    <option value="5">Friday</option>
    <option value="6">Saturday</option>
  </select>
</div>
          </div>
        </div>
      </div>
  );
}