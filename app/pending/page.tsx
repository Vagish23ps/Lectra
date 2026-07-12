"use client";

import { ArrowLeft, CalendarDays, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEntryStore } from "@/store/entryStore";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);
  const updateEntry = useEntryStore((state) => state.updateEntry);

  const pendingWorks = entries.flatMap((entry) =>
    entry.works
      .filter((work) => work.addToPending && !work.completed)
      .map((work) => ({
        work,
        entry,
      }))
  );

  const completeWork = (entryId: string, workId: string) => {
    const entry = entries.find((item) => item.id === entryId);

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
  <Button
    variant="outline"
    size="icon"
    onClick={() => router.push("/")}
    aria-label="Back to Dashboard"
    >
    <ArrowLeft className="h-5 w-5" />
    </Button>

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
            <h1 className="text-3xl font-bold">Pending Work</h1>

            <p className="text-sm text-slate-400">
              {pendingWorks.length} tasks waiting for you
            </p>
          </div>
        </div>

        {pendingWorks.length === 0 ? (
          <Card className="mt-10 rounded-3xl border-slate-700 bg-[#111827]">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <CheckCircle2 className="mb-5 h-14 w-14 text-green-500" />

              <h2 className="text-xl font-semibold">
                You're all caught up
              </h2>

              <p className="mt-2 text-slate-400">
                No pending academic work.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {pendingWorks.map(({ work, entry }) => (
              <Card
                key={work.id}
                className="rounded-3xl border-slate-700 bg-[#111827]"
              >
                <CardContent className="py-5">
                  <p className="text-lg font-semibold">
                    {work.task}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="text-blue-400">
                      {entry.subject}
                    </span>

                    <span className="text-slate-500">•</span>

                    <span className="text-slate-400">
                      {entry.entryName}
                    </span>
                  </div>

                  {work.deadline && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-orange-400">
                      <CalendarDays className="h-4 w-4" />

                      {new Date(
                        `${work.deadline}T00:00:00`
                      ).toLocaleDateString()}
                    </div>
                  )}

                  <Button
                    className="mt-5 w-full"
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
      </div>
    </main>
  );
}