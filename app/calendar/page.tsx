"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

import { useEntryStore } from "@/store/entryStore";
import EntryCard from "@/components/dashboard/EntryCard";

export default function CalendarPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date()
  );

  const selectedEntries = entries.filter((entry) =>
    isSameDay(
      new Date(entry.createdAt),
      selectedDate
    )
  );

  const entryDates = entries.map(
    (entry) => new Date(entry.createdAt)
  );

  return (
    <main className="min-h-screen bg-background px-5 pb-8 pt-7 text-foreground">
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
                  hasEntry: entryDates,
                }}
                modifiersClassNames={{
                  hasEntry:
                    "font-semibold text-primary underline decoration-primary underline-offset-4",
                }}
                className="w-full max-w-sm"
              />
            </div>

            {/* Calendar Hint */}

            <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />

              <span>
                Highlighted dates contain entries
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date */}

        <section className="mt-8">
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
                  {format(
                    selectedDate,
                    "EEEE, dd MMMM yyyy"
                  )}
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
            <Card className="mt-5 rounded-3xl border-border bg-card">
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
          ) : (
            <div className="mt-5 space-y-4">
              {selectedEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}