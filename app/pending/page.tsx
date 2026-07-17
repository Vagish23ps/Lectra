"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ListTodo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ViewEntryDialog from "@/components/dialogs/ViewEntryDialog";
import { useEntryStore } from "@/store/entryStore";
import { Entry } from "@/types/entry";

export default function PendingPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);

  const updateEntry = useEntryStore(
    (state) => state.updateEntry
  );

  const [selectedEntry, setSelectedEntry] =
    useState<Entry | null>(null);

  const [openView, setOpenView] =
    useState(false);

  const pendingWorks = entries
    .flatMap((entry) =>
      entry.works
        .filter(
          (work) =>
            work.addToPending &&
            !work.completed &&
            work.task.trim() !== ""
        )
        .map((work) => ({
          work,
          entry,
        }))
    )
    .sort((a, b) => {
      // Both have no deadline
      if (!a.work.deadline && !b.work.deadline) return 0;

      // Tasks without deadline go to the bottom
      if (!a.work.deadline) return 1;
      if (!b.work.deadline) return -1;

      // Nearest deadline first
      return (
        new Date(a.work.deadline).getTime() -
        new Date(b.work.deadline).getTime()
      );
    });

  const completeWork = (
    entryId: string,
    workId: string
  ) => {
    const entry = entries.find(
      (item) => item.id === entryId
    );

    if (!entry) return;

    const updatedEntry = {
      ...entry,
      works: entry.works.map((work) =>
        work.id === workId
          ? {
              ...work,
              completed: true,
            }
          : work
      ),
    };

    updateEntry(updatedEntry);
  };
  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-7 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}

        <header className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Important Tasks
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {pendingWorks.length === 0
                ? "Nothing waiting for you"
                : `${pendingWorks.length} ${
                    pendingWorks.length === 1
                      ? "task"
                      : "tasks"
                  } waiting for you`}
            </p>
          </div>

          {pendingWorks.length > 0 && (
            <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-amber-500/10 px-3 text-sm font-semibold text-amber-400">
              {pendingWorks.length}
            </div>
          )}
        </header>

        {/* Empty State */}

        {pendingWorks.length === 0 ? (
          <Card className="mt-10 rounded-3xl border-border bg-card">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                You're all caught up
              </h2>

              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                No pending tasks right now. Enjoy the suspiciously
                peaceful moment 🎉
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {pendingWorks.map(({ work, entry }) => (
              <Card
                key={work.id}
                className="overflow-hidden rounded-3xl border-border bg-card transition-colors hover:border-primary/50"
              >
                <CardContent className="p-5">
                  {/* Clickable Header */}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setOpenView(true);
                    }}
                    className="group flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <ListTodo className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-base font-semibold">
                        {work.task}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                          {entry.subject}
                        </span>

                        <span className="text-muted-foreground">
                          •
                        </span>

                        <span className="text-muted-foreground">
                          {entry.entryName}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </button>

                  {/* Deadline */}

                  <div className="mt-5 border-t border-border pt-4 space-y-2">
                    {work.deadline ? (
                      <div className="flex items-center gap-2 text-sm text-amber-400">
                        <CalendarDays className="h-4 w-4 shrink-0" />

                        <span>
                          Due{" "}
                          {new Date(`${work.deadline}T00:00:00`).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4 shrink-0" />

                        <span>No deadline set</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4 shrink-0" />

                      <span>
                        Created{" "}
                        {new Date(entry.createdAt).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Complete Button */}

                  <Button
                    className="mt-5 h-11 w-full rounded-xl"
                    onClick={() =>
                      completeWork(entry.id, work.id)
                    }
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Dialog */}

        <ViewEntryDialog
          open={openView}
          onOpenChange={setOpenView}
          entry={selectedEntry}
        />
      </div>
    </main>
  );
}