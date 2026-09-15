"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Repeat,
  Pause,
  Play,
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  FileText,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { ActiveReminderItem } from "@/hooks/useActiveReminders";
import { formatReminderSummary, formatTime12h, WEEKDAYS, WEEKDAYS_SHORT } from "./ReminderSummary";
import ReminderConfigModal from "./ReminderConfigModal";
import SnoozeModal from "./SnoozeModal";
import { useEntryStore } from "@/store/entryStore";
import { useRouter } from "next/navigation";
import { CustomReminder } from "@/types/reminder";
import { toast } from "sonner";

interface ReminderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ActiveReminderItem | null;
}

export default function ReminderDetailModal({
  open,
  onOpenChange,
  item,
}: ReminderDetailModalProps) {
  const router = useRouter();
  const updateReminder = useEntryStore((state) => state.updateReminder);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);

  if (!item) return null;

  const { reminder, entryId, entryName, subject, workId, workTask, isTask, nextOccurrence, isExpired } = item;
  const isPaused = !reminder.enabled;
  const isRecurring = reminder.type === "recurring";

  const handleTogglePause = () => {
    const nextEnabled = !reminder.enabled;
    const updated: CustomReminder = { ...reminder, enabled: nextEnabled };
    updateReminder(entryId, workId || null, updated);
    toast.success(nextEnabled ? "Reminder resumed" : "Reminder paused");
  };

  const handleDelete = () => {
    updateReminder(entryId, workId || null, undefined);
    onOpenChange(false);
    toast.success("Reminder deleted");
  };

  const handleGoToEntry = () => {
    onOpenChange(false);
    const workQuery = workId ? `&workId=${workId}` : "";
    router.push(`/?viewEntry=${entryId}${workQuery}`);
  };

  const handleEditSave = (updatedReminder: CustomReminder) => {
    updateReminder(entryId, workId || null, updatedReminder);
    toast.success("Reminder saved");
  };

  const handleSnooze = (snoozeDate: Date) => {
    const updated: CustomReminder = {
      ...reminder,
      snoozedUntil: snoozeDate.toISOString(),
    };
    updateReminder(entryId, workId || null, updated);
    toast.success(`Reminder snoozed until ${format(snoozeDate, "d MMM, hh:mm a")}`);
  };

  const handleClearSnooze = () => {
    const updated: CustomReminder = {
      ...reminder,
      snoozedUntil: undefined,
    };
    updateReminder(entryId, workId || null, updated);
    toast.success("Snooze cleared. Normal schedule restored.");
  };

  const isSnoozed = item.isSnoozed;

  const frequencyLabel = isRecurring
    ? (reminder.recurrence?.frequency || "daily").charAt(0).toUpperCase() +
      (reminder.recurrence?.frequency || "daily").slice(1)
    : "One-time";

  const daysLabel = (() => {
    if (!isRecurring) return null;
    const freq = reminder.recurrence?.frequency;
    if (freq === "weekly") {
      const day = reminder.recurrence?.daysOfWeek?.[0] ?? 0;
      return WEEKDAYS[day];
    }
    if (freq === "selected-days") {
      const days = reminder.recurrence?.daysOfWeek || [];
      return days.map((d) => WEEKDAYS_SHORT[d]).join(", ");
    }
    if (freq === "monthly") {
      return `Day ${reminder.recurrence?.dayOfMonth ?? 1}`;
    }
    return null;
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="box-border flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-x-hidden overflow-y-auto rounded-3xl border-border bg-popover p-4 sm:p-5 sm:max-w-md">
          <DialogHeader className="box-border w-full min-w-0 pb-3 pr-10 text-left">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground sm:text-lg">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isPaused ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
              }`}>
                {isRecurring ? <Repeat className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </div>
              <span className="truncate">Reminder Details</span>
            </DialogTitle>
          </DialogHeader>

          <div className="box-border w-full min-w-0 space-y-4">
            {/* Schedule Summary */}
            <div className={`rounded-2xl border p-3.5 ${
              isPaused
                ? "border-border bg-muted/30"
                : isExpired
                ? "border-amber-500/20 bg-amber-500/5"
                : isSnoozed
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-primary/20 bg-primary/5"
            }`}>
              <p className="text-sm font-semibold text-foreground">
                {formatReminderSummary(reminder)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {isPaused && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    <Pause className="h-2.5 w-2.5" />
                    Paused
                  </span>
                )}
                {isSnoozed && item.snoozedUntilDate && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
                    <Clock className="h-2.5 w-2.5" />
                    Snoozed until {format(item.snoozedUntilDate, "d MMM, hh:mm a")}
                  </span>
                )}
                {isExpired && !isSnoozed && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
                    Expired
                  </span>
                )}
                {isRecurring && !isPaused && !isExpired && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Repeat className="h-2.5 w-2.5" />
                    Active
                  </span>
                )}
                {!isRecurring && !isPaused && !isExpired && !isSnoozed && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Bell className="h-2.5 w-2.5" />
                    Scheduled
                  </span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
              {/* Type & Frequency */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </p>
                  <p className="text-sm font-medium text-foreground">{frequencyLabel}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Time
                  </p>
                  <p className="text-sm font-medium text-foreground">{formatTime12h(reminder.time)}</p>
                </div>
              </div>

              {/* Date (one-time) or Days (recurring) */}
              {reminder.type === "one-time" && reminder.date && (
                <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {(() => {
                        const [y, m, d] = reminder.date!.split("-").map(Number);
                        return format(new Date(y, m - 1, d), "d MMM yyyy");
                      })()}
                    </p>
                  </div>
                </div>
              )}

              {daysLabel && (
                <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Days
                    </p>
                    <p className="text-sm font-medium text-foreground">{daysLabel}</p>
                  </div>
                </div>
              )}

              {/* Next Occurrence */}
              {nextOccurrence && !isExpired && !isPaused && (
                <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Next Occurrence
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {format(nextOccurrence, "d MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                </div>
              )}

              {/* Linked Entry/Task */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  {isTask ? <ListTodo className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {isTask ? "Task" : "Entry"}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {isTask ? workTask : entryName}
                  </p>
                  {subject && (
                    <p className="truncate text-xs text-muted-foreground">{subject}</p>
                  )}
                </div>
              </div>

              {/* Created */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(reminder.createdAt), "d MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {/* Go to Entry */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoToEntry}
                className="h-10 w-full gap-2 rounded-xl text-xs font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                Go to Entry
              </Button>

              {/* Pause / Resume */}
              <Button
                type="button"
                variant="outline"
                onClick={handleTogglePause}
                className={`h-10 w-full gap-2 rounded-xl text-xs font-semibold ${
                  isPaused
                    ? "border-primary/30 text-primary hover:bg-primary/10"
                    : "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume Reminder
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause Reminder
                  </>
                )}
              </Button>

              {/* Snooze */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setSnoozeModalOpen(true)}
                className="h-10 w-full gap-2 rounded-xl text-xs font-semibold"
              >
                <Clock className="h-4 w-4 text-primary" />
                {isSnoozed ? "Change / Clear Snooze" : "Snooze Reminder"}
              </Button>

              {/* Edit */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(true)}
                className="h-10 w-full gap-2 rounded-xl text-xs font-semibold"
              >
                <Pencil className="h-4 w-4" />
                Edit Reminder
              </Button>

              {/* Delete */}
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="h-10 w-full gap-2 rounded-xl border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit sub-modal */}
      <ReminderConfigModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialReminder={reminder}
        onSave={handleEditSave}
        title={isTask ? "Edit Task Reminder" : "Edit Reminder"}
      />

      {/* Snooze sub-modal */}
      <SnoozeModal
        open={snoozeModalOpen}
        onOpenChange={setSnoozeModalOpen}
        isCurrentlySnoozed={isSnoozed}
        onSnooze={handleSnooze}
        onClearSnooze={handleClearSnooze}
      />
    </>
  );
}
