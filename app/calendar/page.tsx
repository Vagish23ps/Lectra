"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { ArrowLeft, CalendarDays, ClipboardList, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

import { useEntryStore } from "@/store/entryStore";
import EntryCard from "@/components/dashboard/EntryCard";
import AddEntryDialog from "@/components/dialogs/AddEntryDialog";
import { motion, AnimatePresence } from "framer-motion";
import { itemVariants, listVariants } from "@/lib/animations";

export default function CalendarPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [slideDirection, setSlideDirection] = useState<number>(0);
  const [openAddEntry, setOpenAddEntry] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedCopy = new Date(selectedDate);
  selectedCopy.setHours(0, 0, 0, 0);
  const canCreateEntry = selectedCopy.getTime() <= today.getTime();

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Only trigger when the gesture is clearly horizontal
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsed < 500) {
      if (deltaX < 0) {
        // Swipe left -> next month
        setSlideDirection(1);
        setCurrentMonth((prev) => addMonths(prev, 1));
      } else {
        // Swipe right -> previous month
        setSlideDirection(-1);
        setCurrentMonth((prev) => subMonths(prev, 1));
      }
    }
  };

  const selectedEntries = entries.filter((entry) => {
    const entryDateStr = entry.entryDate || format(new Date(entry.createdAt), "yyyy-MM-dd");
    return entryDateStr === format(selectedDate, "yyyy-MM-dd");
  });

  type DayStatus = "completed" | "pending" | "important";

  const completedDates: Date[] = [];
  const pendingDates: Date[] = [];
  const importantDates: Date[] = [];

  const dayStatus = new Map<string, DayStatus>();

  entries.forEach((entry) => {
    const key = entry.entryDate || format(new Date(entry.createdAt), "yyyy-MM-dd");

    const hasImportant = entry.works.some(
      (work) => work.addToPending && !work.completed && work.task.trim() !== "",
    );

    const hasPending = entry.works.some(
      (work) => !work.completed && work.task.trim() !== "",
    );

    let status: DayStatus = "completed";

    if (hasImportant) {
      status = "important";
    } else if (hasPending) {
      status = "pending";
    }

    const existing = dayStatus.get(key);

    if (existing === "important") return;

    if (existing === "pending" && status === "completed") return;

    dayStatus.set(key, status);
  });

  dayStatus.forEach((status, date) => {
    const d = new Date(date);

    if (status === "completed") {
      completedDates.push(d);
    } else if (status === "pending") {
      pendingDates.push(d);
    } else {
      importantDates.push(d);
    }
  });

  return (
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/")}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Calendar
            </h1>

            <p className="text-xs text-muted-foreground">
              View entries by date
            </p>
          </div>
        </header>

        {/* Calendar Card */}
        <motion.div variants={itemVariants} className="mt-5 sm:mt-6">
          <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div
                className="flex justify-center touch-pan-y no-page-swipe select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <motion.div
                  key={format(currentMonth, "yyyy-MM")}
                  initial={{ opacity: 0.85, x: slideDirection * 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="w-full max-w-sm"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    month={currentMonth}
                    onMonthChange={(newMonth) => {
                      if (newMonth) {
                        setSlideDirection(newMonth.getTime() > currentMonth.getTime() ? 1 : -1);
                        setCurrentMonth(newMonth);
                      }
                    }}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        const t = new Date();
                        t.setHours(0, 0, 0, 0);
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        if (d.getTime() > t.getTime()) {
                          setOpenAddEntry(false);
                        }
                      }
                    }}
                    modifiers={{
                      completed: completedDates,
                      pending: pendingDates,
                      important: importantDates,
                    }}
                    className="w-full"
                  />
                </motion.div>
              </div>

              {/* Calendar Hint Legend */}
              <div className="mt-4 flex items-center justify-center gap-5 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Pending</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>Important</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Date Section */}
        <motion.section className="mt-6 sm:mt-7" variants={itemVariants}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected Date
                </p>

                <h2 className="mt-0.5 text-base font-semibold leading-6 text-foreground sm:text-lg">
                  {format(selectedDate, "EEEE, dd MMMM yyyy")}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedEntries.length > 0 && (
                <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                  {selectedEntries.length}
                </span>
              )}
              {canCreateEntry && (
                <Button
                  size="sm"
                  className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 shadow-xs"
                  onClick={() => setOpenAddEntry(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Entry
                </Button>
              )}
            </div>
          </div>

          {/* No Entries */}
          {selectedEntries.length === 0 ? (
            <motion.div
              className="mt-3.5"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="rounded-3xl border-border bg-card shadow-xs">
                <CardContent className="flex flex-col items-center px-5 py-7 text-center sm:py-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                    <ClipboardList className="h-5 w-5" />
                  </div>

                  <p className="mt-2.5 text-xs sm:text-sm font-medium text-muted-foreground">
                    No entries on this day.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div className="mt-3.5 space-y-3 sm:space-y-4" variants={listVariants}>
              <AnimatePresence mode="popLayout">
                {selectedEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <EntryCard entry={entry} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>
      </div>

      <AddEntryDialog
        externalOpen={openAddEntry}
        onExternalOpenChange={setOpenAddEntry}
        defaultEntryDate={format(selectedDate, "yyyy-MM-dd")}
      />
    </main>
  );
}
