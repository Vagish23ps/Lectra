"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomReminder, ReminderFrequency } from "@/types/reminder";
import {
  WEEKDAYS,
  WEEKDAYS_SHORT,
  formatReminderSummary,
} from "./ReminderSummary";
import { Bell, Repeat, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ReminderConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialReminder?: CustomReminder;
  onSave: (reminder: CustomReminder) => void;
  title?: string;
}

export default function ReminderConfigModal({
  open,
  onOpenChange,
  initialReminder,
  onSave,
  title = "Set Reminder",
}: ReminderConfigModalProps) {
  const [type, setType] = useState<"one-time" | "recurring">("one-time");
  const [time, setTime] = useState<string>("09:00");
  const [date, setDate] = useState<string>("");
  const [frequency, setFrequency] = useState<ReminderFrequency>("daily");
  const [weeklyDay, setWeeklyDay] = useState<number>(1); // Monday default
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri default
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open) {
      setError("");
      if (initialReminder) {
        setType(initialReminder.type || "one-time");
        setTime(initialReminder.time || "09:00");
        setDate(initialReminder.date || format(new Date(), "yyyy-MM-dd"));
        if (initialReminder.recurrence) {
          setFrequency(initialReminder.recurrence.frequency || "daily");
          if (initialReminder.recurrence.daysOfWeek?.length) {
            setWeeklyDay(initialReminder.recurrence.daysOfWeek[0]);
            setSelectedDays(initialReminder.recurrence.daysOfWeek);
          }
          if (initialReminder.recurrence.dayOfMonth) {
            setDayOfMonth(initialReminder.recurrence.dayOfMonth);
          }
        }
      } else {
        // Default new reminder
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const nextTimeStr = `${String(nextHour.getHours()).padStart(2, "0")}:00`;

        setType("one-time");
        setTime(nextTimeStr);
        setDate(format(now, "yyyy-MM-dd"));
        setFrequency("daily");
        setWeeklyDay(1);
        setSelectedDays([1, 3, 5]);
        setDayOfMonth(1);
      }
    }
  }, [open, initialReminder]);

  const toggleSelectedDay = (dayIndex: number) => {
    setError("");
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) {
        setError("At least one day must be selected.");
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort((a, b) => a - b));
    }
  };

  // Construct draft reminder for preview and saving
  const draftReminder: CustomReminder = {
    id: initialReminder?.id || crypto.randomUUID(),
    enabled: initialReminder?.enabled ?? true,
    type,
    time: time || "09:00",
    date: type === "one-time" ? date : undefined,
    recurrence:
      type === "recurring"
        ? {
            frequency,
            daysOfWeek:
              frequency === "weekly"
                ? [weeklyDay]
                : frequency === "selected-days"
                ? selectedDays
                : undefined,
            dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
          }
        : undefined,
    createdAt: initialReminder?.createdAt || new Date().toISOString(),
  };

  const handleSave = () => {
    setError("");

    if (!time) {
      setError("Please select a valid time.");
      return;
    }

    if (type === "one-time") {
      if (!date) {
        setError("Please select a date for the reminder.");
        return;
      }

      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = time.split(":").map(Number);
      const scheduledDate = new Date(year, month - 1, day, hour, minute, 0, 0);

      if (scheduledDate.getTime() <= Date.now()) {
        setError("Reminder time must be in the future.");
        return;
      }
    } else if (type === "recurring") {
      if (frequency === "selected-days" && selectedDays.length === 0) {
        setError("Please select at least one day.");
        return;
      }
      if (frequency === "monthly" && (dayOfMonth < 1 || dayOfMonth > 28)) {
        setError("Please select a day between 1 and 28.");
        return;
      }
    }

    onSave(draftReminder);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-sm overflow-x-hidden overflow-y-auto rounded-3xl border-border bg-popover p-5 sm:max-w-md">
        <DialogHeader className="pb-3 text-left">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Toggle: One-Time vs Recurring */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/60 p-1">
            <button
              type="button"
              onClick={() => {
                setType("one-time");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                type === "one-time"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              One-Time
            </button>

            <button
              type="button"
              onClick={() => {
                setType("recurring");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                type === "recurring"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Repeat className="h-3.5 w-3.5" />
              Recurring
            </button>
          </div>

          {/* Time Picker */}
          <div className="rounded-2xl border border-border bg-card p-3.5">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Reminder Time
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setError("");
              }}
              className="h-11 rounded-xl bg-secondary/40 text-sm font-medium"
            />
          </div>

          {/* One-Time Date Picker */}
          {type === "one-time" && (
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Reminder Date
              </label>
              <Input
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError("");
                }}
                className="h-11 rounded-xl bg-secondary/40 text-sm font-medium"
              />
            </div>
          )}

          {/* Recurring Options */}
          {type === "recurring" && (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Repeat className="h-3.5 w-3.5" />
                Repeat Frequency
              </label>

              {/* Frequency Grid */}
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "daily", label: "Daily" },
                    { id: "weekly", label: "Weekly" },
                    { id: "selected-days", label: "Selected Days" },
                    { id: "monthly", label: "Monthly" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFrequency(f.id);
                      setError("");
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      frequency === f.id
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Weekly Day Selector */}
              {frequency === "weekly" && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Repeat every
                  </label>
                  <select
                    value={weeklyDay}
                    onChange={(e) => setWeeklyDay(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    {WEEKDAYS.map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Days Selector */}
              {frequency === "selected-days" && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Select active days:
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS_SHORT.map((name, index) => {
                      const isSelected = selectedDays.includes(index);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleSelectedDay(index)}
                          className={`flex h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                              : "border border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly Day Selector */}
              {frequency === "monthly" && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs font-medium text-muted-foreground">
                      Day of the month:
                    </label>
                    <select
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className="h-10 rounded-xl border border-border bg-secondary/40 px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Repeats on day {dayOfMonth} of every month.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Live Summary Preview */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs font-medium text-primary">
            <span className="font-semibold">Summary: </span>
            {formatReminderSummary(draftReminder)}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Save Reminder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
