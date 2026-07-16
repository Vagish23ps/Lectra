  "use client";

  import { useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import { format } from "date-fns";
  import {
    CalendarDays,
    ClipboardList,
    ChevronRight,
    ListTodo,
  } from "lucide-react";

  import { Card, CardContent } from "@/components/ui/card";
  import AddEntryDialog from "@/components/dialogs/AddEntryDialog";
  import { useEntryStore } from "@/store/entryStore";
  import EntryCard from "./EntryCard";

  export default function Dashboard() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    const router = useRouter();

    const entries = useEntryStore((state) => state.entries);

    useEffect(() => {
      setCurrentDate(new Date());
    }, []);

    const today = currentDate
      ? format(currentDate, "EEEE, dd MMMM yyyy")
      : "";

    const hour = currentDate?.getHours();

    const greeting = "Hi there..!";
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
      <main className="min-h-screen bg-background px-5 pb-8 pt-7 text-foreground">
        <div className="mx-auto w-full max-w-4xl">
          {/* Brand */}

          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
              L
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Lectra
              </h1>

              <p className="truncate text-sm text-muted-foreground">
                Capture Today. Recall Anytime.
              </p>
            </div>
          </header>

          {/* Greeting */}

          <section className="mt-9">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {greeting }
            </h2>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />

              <span>{today || "Loading date..."}</span>
            </div>
          </section>

          {/* Add Entry */}

          <section className="mt-7">
            <AddEntryDialog />
          </section>

          {/* Today's Entries */}

          <section className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Today's Entries
                </h3>

                {todayEntries.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {todayEntries.length}{" "}
                    {todayEntries.length === 1 ? "entry" : "entries"} captured
                    today
                  </p>
                )}
              </div>

              {todayEntries.length > 0 && (
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                  {todayEntries.length}
                </span>
              )}
            </div>

            {todayEntries.length === 0 ? (
              <Card className="mt-5 rounded-3xl border-border bg-card">
                <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <h4 className="mt-5 text-lg font-semibold text-foreground">
                    Nothing captured yet
                  </h4>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Add your first entry and start building your daily timeline.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="mt-5 space-y-4">
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
              className="cursor-pointer rounded-3xl border-border bg-card transition-colors hover:border-primary/50"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    pendingCount > 0
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  <ListTodo className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground">
                    Important Tasks
                  </h4>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {pendingCount === 0
                      ? "No important tasks pending"
                      : `${pendingCount} ${
                          pendingCount === 1 ? "task" : "tasks"
                        } waiting for you`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                      pendingCount > 0
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    {pendingCount}
                  </span>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    );
  }