"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Moon, Sun, Calendar, RotateCcw } from "lucide-react";
import { format, addMinutes, addHours } from "date-fns";

interface SnoozeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCurrentlySnoozed?: boolean;
  onSnooze: (date: Date) => void;
  onClearSnooze?: () => void;
}

export default function SnoozeModal({
  open,
  onOpenChange,
  isCurrentlySnoozed,
  onSnooze,
  onClearSnooze,
}: SnoozeModalProps) {
  const [showCustom, setShowCustom] = useState(false);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = format(tomorrow, "yyyy-MM-dd");

  const [customDate, setCustomDate] = useState(defaultDateStr);
  const [customTime, setCustomTime] = useState("09:00");

  const handlePreset = (minutes: number) => {
    const target = addMinutes(new Date(), minutes);
    onSnooze(target);
    onOpenChange(false);
  };

  const handleTomorrow = () => {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
    onSnooze(target);
    onOpenChange(false);
  };

  const handleCustomApply = () => {
    if (!customDate || !customTime) return;
    const [y, m, d] = customDate.split("-").map(Number);
    const [h, min] = customTime.split(":").map(Number);
    const target = new Date(y, m - 1, d, h, min, 0, 0);
    onSnooze(target);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="box-border w-[calc(100vw-2rem)] max-w-sm rounded-3xl border-border bg-popover p-4 sm:p-5">
        <DialogHeader className="pb-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
            <Clock className="h-5 w-5 text-primary" />
            <span>Snooze Reminder</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          {!showCustom ? (
            <>
              {/* Quick Presets */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePreset(10)}
                className="h-11 w-full justify-start gap-3 rounded-xl border-border px-3.5 text-xs font-semibold sm:text-sm"
              >
                <Clock className="h-4 w-4 text-primary" />
                <span>10 Minutes</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(addMinutes(new Date(), 10), "hh:mm a")}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handlePreset(30)}
                className="h-11 w-full justify-start gap-3 rounded-xl border-border px-3.5 text-xs font-semibold sm:text-sm"
              >
                <Clock className="h-4 w-4 text-primary" />
                <span>30 Minutes</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(addMinutes(new Date(), 30), "hh:mm a")}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handlePreset(60)}
                className="h-11 w-full justify-start gap-3 rounded-xl border-border px-3.5 text-xs font-semibold sm:text-sm"
              >
                <Clock className="h-4 w-4 text-primary" />
                <span>1 Hour</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(addHours(new Date(), 1), "hh:mm a")}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTomorrow}
                className="h-11 w-full justify-start gap-3 rounded-xl border-border px-3.5 text-xs font-semibold sm:text-sm"
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Tomorrow Morning</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  9:00 AM
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustom(true)}
                className="h-11 w-full justify-start gap-3 rounded-xl border-border px-3.5 text-xs font-semibold sm:text-sm"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Custom Date & Time</span>
              </Button>

              {isCurrentlySnoozed && onClearSnooze && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClearSnooze();
                    onOpenChange(false);
                  }}
                  className="mt-2 h-10 w-full gap-2 rounded-xl border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Snooze (Restore Schedule)</span>
                </Button>
              )}
            </>
          ) : (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Date
                </label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl bg-card text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Time
                </label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl bg-card text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustom(false)}
                  className="h-10 flex-1 rounded-xl text-xs font-medium"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCustomApply}
                  className="h-10 flex-1 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Apply Snooze
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
