"use client";

import { CalendarDays, Plus, ClipboardList, CalendarRange, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import AddEntryDialog from "@/components/dialogs/AddEntryDialog";
import { useEntryStore } from "@/store/entryStore";
import EntryCard from "./EntryCard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const today = currentDate
    ? format(currentDate, "EEEE, dd MMMM yyyy")
    : "";

  const hour = currentDate?.getHours();

  const greeting =
    hour === undefined
      ? ""
      : hour < 12
      ? "Good Morning ☀️"
      : hour < 17
      ? "Good Afternoon 🌤️"
      : "Good Evening 🌙";
    const router = useRouter();

    const entries = useEntryStore((state) => state.entries);
    const todayEntries = currentDate
      ? entries.filter(
          (entry) =>
            format(new Date(entry.createdAt), "yyyy-MM-dd") ===
            format(currentDate, "yyyy-MM-dd")
        )
      : [];

    const pendingCount = entries.flatMap((entry) =>
      entry.works.filter(
        (work) => work.addToPending && !work.completed
      )
    ).length;
  return (
    <main className="min-h-screen bg-[#0B1120] text-white px-5 py-8">
      {/* Logo */}

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold">
          L
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lectra</h1>
          <p className="text-sm text-slate-400">
            Capture Today. Recall Anytime.
          </p>
        </div>
      </div>

      {/* Greeting */}

      <div className="mt-10">
        <h2 className="text-2xl font-semibold">{greeting}</h2>

        <div className="mt-2 flex items-center gap-2 text-slate-400">
          <CalendarDays size={18} />
          <span>{today}</span>
        </div>
      </div>

      {/* Quick Actions */}

      <div className="mt-8 space-y-3">
        <AddEntryDialog />

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-slate-700 bg-[#111827]"
            onClick={() => router.push("/calendar")}
          >
            <CalendarRange className="mr-2 h-5 w-5" />
            Calendar
          </Button>

          <Button
            variant="outline"
            className="h-14 rounded-2xl border-slate-700 bg-[#111827]"
            onClick={() => router.push("/search")}
          >
            <Search className="mr-2 h-5 w-5" />
            Search
          </Button>
        </div>
      </div>
      {/* Today's Entries */}

      <section className="mt-10">

  <h3 className="text-xl font-semibold">
    Today's Entries
  </h3>

  {todayEntries.length === 0 ? (

    <Card className="mt-5 rounded-3xl border-slate-700 bg-[#111827]">

      <CardContent className="flex flex-col items-center py-12 text-center">

        <ClipboardList
          size={55}
          className="mb-5 text-slate-500"
        />

        <h4 className="text-xl font-semibold">
          Your academic timeline starts here
        </h4>

        <p className="mt-3 text-slate-400">
          Nothing recorded today.
        </p>

      </CardContent>

    </Card>

  ) : (

    <div className="space-y-4 mt-5">

      {todayEntries.map((entry) => (

      <EntryCard
        key={entry.id}
        entry={entry}
      />

      ))}

    </div>

  )}

</section>
      {/* Pending Work */}

      <section className="mt-8">
        <Card
          onClick={() => router.push("/pending")}
          className="cursor-pointer rounded-3xl border-slate-700 bg-[#111827]"
        >
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <h4 className="font-semibold">
                Pending Work
              </h4>

              <p className="text-sm text-slate-400">
                {pendingCount === 0
                  ? "No pending tasks 🎉"
                  : `${pendingCount} ${
                      pendingCount === 1 ? "task" : "tasks"
                    } waiting for you`}
              </p>
            </div>

            <div className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}