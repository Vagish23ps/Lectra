"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { usePendingTasks } from "@/hooks/usePendingTasks";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants, listVariants } from "@/lib/animations";

type PendingWorkItem = {
  work: Entry["works"][number];
  entry: Entry;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  hasDeadline: boolean;
};

function PendingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const entries = useEntryStore((state) => state.entries);
  const updateEntry = useEntryStore((state) => state.updateEntry);

  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [openView, setOpenView] = useState(false);
  const [activeTab, setActiveTab] = useState<"important" | "other">(
    "important",
  );

  const overdueRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const tomorrowRef = useRef<HTMLDivElement>(null);
  const remainingRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);

  const {
    overdueTasks,
    dueTodayTasks,
    tomorrowTasks,
    remainingTasks,
    otherImportantTasks,
    normalTasks,
    overdueCount,
    dueTodayCount,
    tomorrowCount,
    remainingCount,
    otherTasksCount,
    totalPendingCount,
  } = usePendingTasks();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const section = searchParams.get("section");

    if (tab === "important" || tab === "other") {
      setActiveTab(tab);
    }

    const timer = window.setTimeout(() => {
      switch (section) {
        case "overdue":
          overdueRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          break;
        case "today":
          todayRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          break;
        case "tomorrow":
          tomorrowRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          break;
        case "remaining":
          remainingRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          break;
        case "other":
          otherRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          break;
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const completeWork = (entryId: string, workId: string) => {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) return;

    const updatedEntry: Entry = {
      ...entry,
      works: entry.works.map((work) =>
        work.id === workId ? { ...work, completed: true } : work,
      ),
    };

    updateEntry(updatedEntry);
  };

  const renderTaskCard = (item: PendingWorkItem) => {
    const { work, entry, isOverdue, isDueToday, isDueTomorrow } = item;

    const borderClass = isOverdue
      ? "border-2 border-red-500"
      : isDueToday
        ? "border-2 border-orange-500"
        : isDueTomorrow
          ? "border-2 border-yellow-500"
          : "border border-border";

    const iconClass = isOverdue
      ? "bg-red-500/10 text-red-400"
      : isDueToday
        ? "bg-orange-500/10 text-orange-400"
        : isDueTomorrow
          ? "bg-yellow-500/10 text-yellow-400"
          : "bg-amber-500/10 text-amber-400";

    const deadlineTextClass = isOverdue
      ? "text-red-400"
      : isDueToday
        ? "text-orange-400"
        : isDueTomorrow
          ? "text-yellow-400"
          : "text-amber-400";

    return (
      <Card
        key={work.id}
        className={`overflow-hidden rounded-3xl bg-card transition-all hover:border-primary/50 ${borderClass}`}
      >
        <CardContent className="p-5">
          <button
            type="button"
            onClick={() => {
              setSelectedEntry(entry);
              setOpenView(true);
            }}
            className="group flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/40"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
              <ListTodo className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-base font-semibold">{work.task}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  {entry.subject || "No subject"}
                </span>

                <span className="text-muted-foreground">•</span>

                <span className="text-muted-foreground">
                  {entry.entryName || "Untitled Entry"}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <div className="mt-5 space-y-2 border-t border-border pt-4">
            {work.deadline ? (
              <div
                className={`flex items-center gap-2 text-sm ${deadlineTextClass}`}
              >
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>
                  Due{" "}
                  {new Date(`${work.deadline}T00:00:00`).toLocaleDateString(
                    undefined,
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
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

          <Button
            className="mt-5 h-11 w-full rounded-xl"
            onClick={() => completeWork(entry.id, work.id)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Completed
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderSimpleTaskCard = (
    work: Entry["works"][number],
    entry: Entry,
    important: boolean,
  ) => {
    return (
      <Card className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50">
        <CardContent className="p-5">
          <button
            type="button"
            onClick={() => {
              setSelectedEntry(entry);
              setOpenView(true);
            }}
            className="group flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/40"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                important
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <ListTodo className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-base font-semibold">{work.task}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  {entry.subject || "No subject"}
                </span>

                <span className="text-muted-foreground">•</span>

                <span className="text-muted-foreground">
                  {entry.entryName || "Untitled Entry"}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4 shrink-0" />
              <span>No deadline set</span>
            </div>

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

          <Button
            className="mt-5 h-11 w-full rounded-xl"
            onClick={() => completeWork(entry.id, work.id)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Completed
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.main
      className="min-h-screen bg-background px-5 pb-28 pt-7 text-foreground"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto w-full max-w-4xl">
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
            <h1 className="text-2xl font-bold tracking-tight">Pending List</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {totalPendingCount === 0
                ? "Nothing waiting for you"
                : `${totalPendingCount} ${
                    totalPendingCount === 1 ? "task" : "tasks"
                  } waiting for you`}
            </p>
          </div>

          {totalPendingCount > 0 && (
            <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-amber-500/10 px-3 text-sm font-semibold text-amber-400">
              {totalPendingCount}
            </div>
          )}
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("important")}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "important"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            Important Tasks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("other")}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "other"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            Other Tasks
          </button>
        </div>

        {totalPendingCount === 0 ? (
          <Card className="mt-10 rounded-3xl border-border bg-card">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                You're all caught up
              </h2>

              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                No pending tasks right now. Enjoy the suspiciously peaceful
                moment 🎉
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8">
            {activeTab === "important" ? (
              <section className="space-y-8">
                <div ref={overdueRef}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight text-red-400">
                      🔴 Overdue
                    </h2>
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                      {overdueCount}
                    </span>
                  </div>

                  {overdueTasks.length === 0 ? (
                    <Card className="rounded-3xl border-border bg-card">
                      <CardContent className="px-6 py-8 text-sm text-muted-foreground">
                        No overdue tasks 🎉
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div className="space-y-4" variants={listVariants}>
                      <AnimatePresence mode="popLayout">
                        {overdueTasks.map((item) => (
                          <motion.div
                            key={item.work.id}
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {renderTaskCard(item)}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                <div ref={todayRef}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight text-orange-400">
                      🟠 Due Today
                    </h2>
                    <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                      {dueTodayCount}
                    </span>
                  </div>

                  {dueTodayTasks.length === 0 ? (
                    <Card className="rounded-3xl border-border bg-card">
                      <CardContent className="px-6 py-8 text-sm text-muted-foreground">
                        Nothing due today.
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div className="space-y-4" variants={listVariants}>
                      <AnimatePresence mode="popLayout">
                        {dueTodayTasks.map((item) => (
                          <motion.div
                            key={item.work.id}
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {renderTaskCard(item)}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                <div ref={tomorrowRef}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight text-yellow-400">
                      🟡 Tomorrow
                    </h2>
                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                      {tomorrowCount}
                    </span>
                  </div>

                  {tomorrowTasks.length === 0 ? (
                    <Card className="rounded-3xl border-border bg-card">
                      <CardContent className="px-6 py-8 text-sm text-muted-foreground">
                        Nothing scheduled for tomorrow.
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div className="space-y-4" variants={listVariants}>
                      <AnimatePresence mode="popLayout">
                        {tomorrowTasks.map((item) => (
                          <motion.div
                            key={item.work.id}
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {renderTaskCard(item)}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                <div ref={remainingRef}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight text-blue-400">
                      🔵 Remaining
                    </h2>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                      {remainingCount}
                    </span>
                  </div>

                  {remainingTasks.length === 0 ? (
                    <Card className="rounded-3xl border-border bg-card">
                      <CardContent className="px-6 py-8 text-sm text-muted-foreground">
                        No remaining scheduled tasks.
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div className="space-y-4" variants={listVariants}>
                      <AnimatePresence mode="popLayout">
                        {remainingTasks.map((item) => (
                          <motion.div
                            key={item.work.id}
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {renderTaskCard(item)}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </section>
            ) : (
              <section className="space-y-8">
                <div ref={otherRef}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Other Tasks
                    </h2>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                      {otherTasksCount}
                    </span>
                  </div>

                  {otherImportantTasks.length === 0 &&
                  normalTasks.length === 0 ? (
                    <Card className="rounded-3xl border-border bg-card">
                      <CardContent className="px-6 py-8 text-sm text-muted-foreground">
                        No other tasks right now.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {otherImportantTasks.length > 0 && (
                        <Card className="rounded-3xl border border-border bg-card">
                          <CardContent className="p-5">
                            <h3 className="text-sm font-semibold text-foreground">
                              Important Tasks without Deadline
                            </h3>

                            <motion.div
                              className="mt-4 space-y-4"
                              variants={listVariants}
                            >
                              <AnimatePresence mode="popLayout">
                                {otherImportantTasks.map(({ work, entry }) => (
                                  <motion.div
                                    key={work.id}
                                    layout
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                  >
                                    {renderSimpleTaskCard(work, entry, true)}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </CardContent>
                        </Card>
                      )}

                      {normalTasks.length > 0 && (
                        <Card className="rounded-3xl border border-border bg-card">
                          <CardContent className="p-5">
                            <h3 className="text-sm font-semibold text-foreground">
                              Normal Tasks
                            </h3>

                            <motion.div
                              className="mt-4 space-y-4"
                              variants={listVariants}
                            >
                              <AnimatePresence mode="popLayout">
                                {normalTasks.map(({ work, entry }) => (
                                  <motion.div
                                    key={work.id}
                                    layout
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                  >
                                    {renderSimpleTaskCard(work, entry, false)}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        <ViewEntryDialog
          open={openView}
          onOpenChange={setOpenView}
          entry={selectedEntry}
        />
      </div>
    </motion.main>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={null}>
      <PendingPageContent />
    </Suspense>
  );
}
