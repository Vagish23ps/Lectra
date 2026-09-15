"use client";

import { useState } from "react";
import { CustomReminder } from "@/types/reminder";
import { formatReminderSummary } from "./ReminderSummary";
import ReminderConfigModal from "./ReminderConfigModal";
import { Bell, Plus, Pencil, Trash2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ReminderSectionProps {
  reminder?: CustomReminder;
  onChange: (reminder: CustomReminder | undefined) => void;
  title?: string;
  isTaskLevel?: boolean;
}

export default function ReminderSection({
  reminder,
  onChange,
  title = "Custom Reminder",
  isTaskLevel = false,
}: ReminderSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSave = (newReminder: CustomReminder) => {
    onChange(newReminder);
  };

  const handleDelete = () => {
    onChange(undefined);
  };

  const computeNextDate = () => {
    if (!reminder) return new Date();
    const now = new Date();
    const [hour, minute] = (reminder.time || "09:00").split(":").map(Number);
    const frequency = reminder.recurrence?.frequency || "daily";
    
    let scheduledDate = new Date(now);
    
    if (frequency === "daily") {
      scheduledDate.setHours(hour, minute, 0, 0);
      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
    } else if (frequency === "weekly") {
      const targetDay = reminder.recurrence?.daysOfWeek?.[0] ?? 0;
      const currentDay = scheduledDate.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0) daysUntil += 7;
      scheduledDate.setDate(scheduledDate.getDate() + daysUntil);
      scheduledDate.setHours(hour, minute, 0, 0);
      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setDate(scheduledDate.getDate() + 7);
      }
    } else if (frequency === "selected-days") {
      const days = reminder.recurrence?.daysOfWeek && reminder.recurrence.daysOfWeek.length > 0
        ? reminder.recurrence.daysOfWeek
        : [0];
      
      let closestDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365); // 1 year away
      for (const targetDay of days) {
        const d = new Date(now);
        const currentDay = d.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        d.setDate(d.getDate() + daysUntil);
        d.setHours(hour, minute, 0, 0);
        if (d.getTime() <= now.getTime()) {
          d.setDate(d.getDate() + 7);
        }
        if (d.getTime() < closestDate.getTime()) {
          closestDate = d;
        }
      }
      scheduledDate = closestDate;
    } else if (frequency === "monthly") {
      const targetDayOfMonth = Math.min(Math.max(reminder.recurrence?.dayOfMonth ?? 1, 1), 28);
      scheduledDate.setDate(targetDayOfMonth);
      scheduledDate.setHours(hour, minute, 0, 0);
      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setMonth(scheduledDate.getMonth() + 1);
        scheduledDate.setDate(targetDayOfMonth);
        scheduledDate.setHours(hour, minute, 0, 0);
      }
    }
    return scheduledDate;
  };

  let nextDateStr: string | null = null;
  let isSkipped = false;
  
  if (reminder && reminder.type === "recurring") {
    nextDateStr = format(computeNextDate(), "yyyy-MM-dd");
    isSkipped = reminder.skipNextDate === nextDateStr;
  }

  const handleSkipNext = () => {
    if (reminder && nextDateStr) {
      onChange({ ...reminder, skipNextDate: nextDateStr });
    }
  };

  if (!reminder) {
    return (
      <>
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-between gap-2">
          <label className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{title}</span>
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 shrink-0 rounded-xl border-dashed px-2.5 text-xs font-medium"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Reminder
          </Button>
        </div>

        <ReminderConfigModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSave={handleSave}
          title={isTaskLevel ? "Set Task Reminder" : "Set Reminder"}
        />
      </>
    );
  }

  return (
    <>
      <div className="box-border w-full min-w-0 max-w-full space-y-2">
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
          <label className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{title}</span>
          </label>
        </div>

        <div className="box-border flex w-full min-w-0 items-center justify-between gap-2.5 rounded-2xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bell className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-foreground">
                {formatReminderSummary(reminder)}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {reminder.type === "one-time"
                  ? "Fires once at scheduled time"
                  : `Repeats ${reminder.recurrence?.frequency || "daily"}`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {reminder.type === "recurring" && (
              isSkipped ? (
                <span className="flex h-8 items-center rounded-lg bg-secondary px-2 text-[10px] font-semibold text-muted-foreground">
                  Skipped
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSkipNext}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Skip next occurrence"
                  title="Skip next occurrence"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              )
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setModalOpen(true)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Edit reminder"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete reminder"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ReminderConfigModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialReminder={reminder}
        onSave={handleSave}
        title={isTaskLevel ? "Edit Task Reminder" : "Edit Reminder"}
      />
    </>
  );
}
