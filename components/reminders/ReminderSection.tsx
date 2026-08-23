"use client";

import { useState } from "react";
import { CustomReminder } from "@/types/reminder";
import { formatReminderSummary } from "./ReminderSummary";
import ReminderConfigModal from "./ReminderConfigModal";
import { Bell, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
