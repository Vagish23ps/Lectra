"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { ArrowLeft, CalendarDays } from "lucide-react";

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
    isSameDay(new Date(entry.createdAt), selectedDate)
  );

  const entryDates = entries.map(
    (entry) => new Date(entry.createdAt)
  );

  return (
    <main className="min-h-screen bg-[#0B1120] px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold">
              Calendar
            </h1>

            <p className="text-sm text-slate-400">
              Explore your academic timeline
            </p>
          </div>
        </div>

        <Card className="mt-8 rounded-3xl border-slate-700 bg-[#111827]">
          <CardContent className="flex justify-center py-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) setSelectedDate(date);
              }}
              modifiers={{
                hasEntry: entryDates,
              }}
              modifiersClassNames={{
                hasEntry:
                  "font-bold text-blue-400 underline underline-offset-4",
              }}
            />
          </CardContent>
        </Card>

        <section className="mt-8">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />

            <h2 className="text-xl font-semibold">
              {format(selectedDate, "EEEE, dd MMMM yyyy")}
            </h2>
          </div>

          {selectedEntries.length === 0 ? (
            <Card className="mt-5 rounded-3xl border-slate-700 bg-[#111827]">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">
                  No entries recorded on this day.
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