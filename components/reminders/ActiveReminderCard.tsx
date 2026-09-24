"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Repeat, Pause, Play, ExternalLink, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActiveReminderItem } from "@/hooks/useActiveReminders";
import { formatReminderSummary } from "./ReminderSummary";

interface ActiveReminderCardProps {
  item: ActiveReminderItem;
  onTogglePause: () => void;
  onViewDetails: () => void;
  onGoToEntry: () => void;
  onSnooze?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ActiveReminderCard({
  item,
  onTogglePause,
  onViewDetails,
  onGoToEntry,
  onSnooze,
  onEdit,
  onDelete,
}: ActiveReminderCardProps) {
  const { reminder, entryName, workTask, isTask, nextOccurrence, isExpired, isSnoozed, snoozedUntilDate, isSkipped } = item;
  const isActive = reminder.enabled && !isExpired;
  const isPaused = !reminder.enabled;
  const isRecurring = reminder.type === "recurring";

  const borderClass = isPaused
    ? "border-border bg-muted/30"
    : isSnoozed
    ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
    : isExpired
    ? "border-amber-500/20 bg-amber-500/5"
    : "border-primary/20 bg-primary/5 hover:border-primary/40";

  const iconBg = isPaused
    ? "bg-muted text-muted-foreground"
    : isSnoozed
    ? "bg-amber-500/10 text-amber-500 dark:text-amber-400"
    : isExpired
    ? "bg-amber-500/10 text-amber-500 dark:text-amber-400"
    : "bg-primary/10 text-primary";

  return (
    <Card
      className={`overflow-hidden rounded-2xl border transition-all shadow-xs ${borderClass}`}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Main content - clickable to view details */}
        <button
          type="button"
          onClick={onViewDetails}
          className="group flex w-full items-start gap-3 text-left"
        >
          {/* Icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            {isPaused ? (
              <Pause className="h-5 w-5" />
            ) : isSnoozed ? (
              <Clock className="h-5 w-5" />
            ) : isRecurring ? (
              <Repeat className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            {/* Schedule summary */}
            <p
              className={`text-sm font-semibold leading-snug ${
                isPaused ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {formatReminderSummary(reminder)}
            </p>

            {/* Linked entry/task */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span
                className={`rounded-md px-2 py-0.5 font-medium ${
                  isTask
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isTask ? "Task" : "Entry"}
              </span>
              <span className="text-muted-foreground truncate max-w-[180px]">
                {isTask ? workTask : entryName}
              </span>
            </div>

            {/* Next occurrence */}
            {nextOccurrence && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {isPaused ? (
                  <span>Paused</span>
                ) : isSnoozed && snoozedUntilDate ? (
                  <span className="text-amber-500 dark:text-amber-400 font-medium">
                    Snoozed until {format(snoozedUntilDate, "d MMM, hh:mm a")}
                  </span>
                ) : isExpired ? (
                  <span className="text-amber-500 dark:text-amber-400 font-medium">
                    Expired
                  </span>
                ) : (
                  <span>
                    Next: {format(nextOccurrence, "d MMM, hh:mm a")}
                  </span>
                )}
              </div>
            )}

            {/* Status badges */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {isPaused && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  <Pause className="h-2.5 w-2.5" />
                  Paused
                </span>
              )}
              {isSnoozed && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
                  <Clock className="h-2.5 w-2.5" />
                  Snoozed
                </span>
              )}
              {isExpired && !isSnoozed && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
                  Expired
                </span>
              )}
              {isRecurring && isActive && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Repeat className="h-2.5 w-2.5" />
                  Recurring
                </span>
              )}
              {isSkipped && (
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Next Skipped
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Action bar */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onGoToEntry}
            className="h-8 gap-1.5 rounded-xl px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Go to Entry
          </Button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                {onSnooze && (
                  <DropdownMenuItem onClick={onSnooze} className="gap-2 cursor-pointer">
                    <Clock className="h-4 w-4" />
                    <span>Snooze</span>
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTogglePause}
              className={`h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold ${
                isPaused
                  ? "border-primary/30 text-primary hover:bg-primary/10"
                  : "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
