"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

import { useEntryStore } from "@/store/entryStore";
import EntryCard from "@/components/dashboard/EntryCard";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants, listVariants } from "@/lib/animations";

export default function CalendarPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedEntries = entries.filter((entry) =>
    isSameDay(new Date(entry.createdAt), selectedDate),
  );

  type DayStatus = "completed" | "pending" | "important";

  const completedDates: Date[] = [];
  const pendingDates: Date[] = [];
  const importantDates: Date[] = [];

  const dayStatus = new Map<string, DayStatus>();

  entries.forEach((entry) => {
    const key = format(new Date(entry.createdAt), "yyyy-MM-dd");

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
    <motion.main
      className="min-h-screen bg-background px-5 pb-8 pt-7 text-foreground"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}

        <header className="flex items-start gap-4">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Calendar
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Travel through your captured timeline.
            </p>
          </div>
        </header>

        {/* Calendar */}

        <motion.div variants={itemVariants}>
          <Card className="mt-8 overflow-hidden rounded-3xl border-border bg-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  modifiers={{
                    completed: completedDates,
                    pending: pendingDates,
                    important: importantDates,
                  }}
                  className="w-full max-w-sm"
                />
              </div>

              {/* Calendar Hint */}

              <div className="mt-4 flex items-center justify-center gap-6 border-t border-border pt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Pending</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>Important</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Date */}

        <motion.section className="mt-8" variants={itemVariants}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Selected Date
                </p>

                <h2 className="mt-1 text-lg font-semibold leading-6 text-foreground">
                  {format(selectedDate, "EEEE, dd MMMM yyyy")}
                </h2>
              </div>
            </div>

            {selectedEntries.length > 0 && (
              <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                {selectedEntries.length}
              </span>
            )}
          </div>

          {/* No Entries */}

          {selectedEntries.length === 0 ? (
            <motion.div
              className="mt-5"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="rounded-3xl border-border bg-card">
                <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <ClipboardList className="h-7 w-7 text-muted-foreground" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    No entries on this day
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Nothing was captured for this date.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div className="mt-5 space-y-4" variants={listVariants}>
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
    </motion.main>
  );
}
