"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BarChart3,
  Calendar,
  Clock,
  AlertTriangle,
  Clock3,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";

export default function NotificationSettingsPage() {
  const router = useRouter();
  const settings = useNotificationSettingsStore();

  const isMasterEnabled = settings.enabled ?? true;

  return (
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/settings")}
            aria-label="Back to Settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Notification Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure reminder categories & schedules
            </p>
          </div>
        </header>

        {/* Master Switch Card */}
        <div className="mt-6 sm:mt-7">
          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    isMasterEnabled
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">
                    Enable Notifications
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isMasterEnabled
                      ? "Notifications are active and scheduled."
                      : "All notifications are currently paused."}
                  </p>
                </div>
              </div>

              <Switch
                checked={isMasterEnabled}
                onCheckedChange={(checked) =>
                  settings.setSetting("enabled", checked)
                }
                aria-label="Toggle all notifications"
              />
            </CardContent>
          </Card>
        </div>

        {/* Category Controls List */}
        <div
          className={`mt-6 sm:mt-7 space-y-3 sm:space-y-3.5 transition-opacity duration-200 ${
            !isMasterEnabled ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notification Categories
            </h3>
            {!isMasterEnabled && (
              <span className="text-xs font-medium text-amber-500 dark:text-amber-400">
                Paused by Master Switch
              </span>
            )}
          </div>

          {/* 1. Due Today Notifications */}
          <div>
            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 dark:text-orange-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        Due Today Notifications
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        Get alerted when tasks are due today.
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={settings.dueTodayReminder ?? settings.dueTodayEnabled ?? true}
                    disabled={!isMasterEnabled}
                    onCheckedChange={(checked) =>
                      settings.setSetting("dueTodayReminder", checked)
                    }
                    aria-label="Toggle Due Today Notifications"
                  />
                </div>

                {/* Reminder Time Picker */}
                {(settings.dueTodayReminder ?? settings.dueTodayEnabled ?? true) && (
                  <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Alert Time</span>
                    </div>

                    <input
                      type="time"
                      disabled={!isMasterEnabled}
                      value={settings.dueTodayReminderTime || "08:00"}
                      onChange={(e) =>
                        settings.setSetting("dueTodayReminderTime", e.target.value)
                      }
                      className="h-8 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 2. Due Tomorrow Notifications */}
          <div>
            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        Due Tomorrow Notifications
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        Advance reminder for tasks due the next day.
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={settings.dueTomorrowReminder ?? settings.dueTomorrowEnabled ?? true}
                    disabled={!isMasterEnabled}
                    onCheckedChange={(checked) =>
                      settings.setSetting("dueTomorrowReminder", checked)
                    }
                    aria-label="Toggle Due Tomorrow Notifications"
                  />
                </div>

                {/* Reminder Time Picker */}
                {(settings.dueTomorrowReminder ?? settings.dueTomorrowEnabled ?? true) && (
                  <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Alert Time</span>
                    </div>

                    <input
                      type="time"
                      disabled={!isMasterEnabled}
                      value={settings.dueTomorrowReminderTime || "17:00"}
                      onChange={(e) =>
                        settings.setSetting("dueTomorrowReminderTime", e.target.value)
                      }
                      className="h-8 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 3. Overdue Notifications */}
          <div>
            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        Overdue Notifications
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        Stay notified about overdue tasks until they are finished.
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={settings.overdueReminder ?? settings.overdueEnabled ?? true}
                    disabled={!isMasterEnabled}
                    onCheckedChange={(checked) =>
                      settings.setSetting("overdueReminder", checked)
                    }
                    aria-label="Toggle Overdue Notifications"
                  />
                </div>

                {/* Reminder Time Picker */}
                {(settings.overdueReminder ?? settings.overdueEnabled ?? true) && (
                  <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Alert Time</span>
                    </div>

                    <input
                      type="time"
                      disabled={!isMasterEnabled}
                      value={settings.overdueReminderTime || "07:30"}
                      onChange={(e) =>
                        settings.setSetting("overdueReminderTime", e.target.value)
                      }
                      className="h-8 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 4. Weekly Summary */}
          <div>
            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        Weekly Summary
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        Receive a weekly summary of deadlines and accomplishments.
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={settings.weeklySummary ?? settings.weeklySummaryEnabled ?? true}
                    disabled={!isMasterEnabled}
                    onCheckedChange={(checked) =>
                      settings.setSetting("weeklySummary", checked)
                    }
                    aria-label="Toggle Weekly Summary"
                  />
                </div>

                {/* Day & Time Pickers */}
                {(settings.weeklySummary ?? settings.weeklySummaryEnabled ?? true) && (
                  <div className="mt-3.5 space-y-2.5 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Summary Day</span>
                      </div>

                      <select
                        disabled={!isMasterEnabled}
                        value={settings.weeklySummaryDay || "6"}
                        onChange={(e) =>
                          settings.setSetting("weeklySummaryDay", e.target.value)
                        }
                        className="h-8 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
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

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>Summary Time</span>
                      </div>

                      <input
                        type="time"
                        disabled={!isMasterEnabled}
                        value={settings.weeklySummaryTime || "19:00"}
                        onChange={(e) =>
                          settings.setSetting("weeklySummaryTime", e.target.value)
                        }
                        className="h-8 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. Custom Reminders */}
          <div>
            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        Custom Reminders
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        Control one-time and recurring alarms you set manually.
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={settings.customReminders ?? settings.customRemindersEnabled ?? true}
                    disabled={!isMasterEnabled}
                    onCheckedChange={(checked) =>
                      settings.setSetting("customReminders", checked)
                    }
                    aria-label="Toggle Custom Reminders"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
