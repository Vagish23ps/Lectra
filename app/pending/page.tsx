"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
  Bell,
  BookOpen,
  ListTodo,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEntryStore } from "@/store/entryStore";
import { usePendingTasks } from "@/hooks/usePendingTasks";
import { Entry } from "@/types/entry";
import ViewEntryDialog from "@/components/dialogs/ViewEntryDialog";
import EditEntryDialog from "@/components/dialogs/EditEntryDialog";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants, listVariants, tabContentVariants } from "@/lib/animations";
import { toast } from "sonner";

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
  const toggleWorkCompleted = useEntryStore((state) => state.toggleWorkCompleted);

  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
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

  const importantCount =
    overdueCount +
    dueTodayCount +
    tomorrowCount +
    remainingCount;

  useEffect(() => {
    if (selectedEntry) {
      const updated = entries.find((e) => e.id === selectedEntry.id);
      if (updated) {
        setSelectedEntry(updated);
      }
    }
  }, [entries, selectedEntry]);

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
    toggleWorkCompleted(entryId, workId);
  };

  const renderTaskCard = (item: PendingWorkItem) => {
    const { work, entry, isOverdue, isDueToday, isDueTomorrow } = item;

    const borderClass = isOverdue
      ? "border-red-500/30 bg-red-500/5 hover:border-red-500/60"
      : isDueToday
        ? "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60"
        : isDueTomorrow
          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60"
          : "border-border bg-card hover:border-primary/40";

    const iconClass = isOverdue
      ? "bg-red-500/10 text-red-500 dark:text-red-400"
      : isDueToday
        ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
        : isDueTomorrow
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : "bg-primary/10 text-primary";

    const deadlineTextClass = isOverdue
      ? "text-red-500 dark:text-red-400 font-medium"
      : isDueToday
        ? "text-orange-500 dark:text-orange-400 font-medium"
        : isDueTomorrow
          ? "text-amber-600 dark:text-amber-400 font-medium"
          : "text-muted-foreground";

    return (
      <Card
        key={work.id}
        className={`overflow-hidden rounded-2xl border transition-all shadow-xs ${borderClass}`}
      >
        <CardContent className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => {
              router.push(`/?viewEntry=${entry.id}&workId=${work.id}`);
            }}
            className="group flex w-full items-start gap-3 rounded-xl text-left transition-all hover:bg-muted/40 cursor-pointer active:scale-[0.99]"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
              <ListTodo className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-sm sm:text-base font-semibold leading-snug text-foreground">
                {work.task}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {entry.subject || "No subject"}
                </span>

                <span className="text-muted-foreground">•</span>

                <span className="text-muted-foreground truncate max-w-[160px]">
                  {entry.entryName || "Untitled Entry"}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <div className="mt-3.5 space-y-1.5 border-t border-border/60 pt-3">
            {work.deadline ? (
              <div
                className={`flex items-center gap-2 text-xs sm:text-sm ${deadlineTextClass}`}
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                <span>No deadline set</span>
              </div>
            )}
          </div>

          <Button
            className="mt-3.5 h-10 w-full rounded-xl text-xs font-semibold"
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
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-primary/40">
        <CardContent className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => {
              router.push(`/?viewEntry=${entry.id}&workId=${work.id}`);
            }}
            className="group flex w-full items-start gap-3 rounded-xl text-left transition-all hover:bg-muted/40 cursor-pointer active:scale-[0.99]"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                important
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <ListTodo className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-sm sm:text-base font-semibold leading-snug text-foreground">
                {work.task}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {entry.subject || "No subject"}
                </span>

                <span className="text-muted-foreground">•</span>

                <span className="text-muted-foreground truncate max-w-[160px]">
                  {entry.entryName || "Untitled Entry"}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <div className="mt-3.5 border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">No deadline set</p>
          </div>

          <Button
            className="mt-3.5 h-10 w-full rounded-xl text-xs font-semibold"
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
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
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
              Pending List
            </h1>

            <p className="text-xs text-muted-foreground">
              {totalPendingCount === 0
                ? "Nothing waiting for you"
                : `${totalPendingCount} ${
                    totalPendingCount === 1 ? "task" : "tasks"
                  } waiting for you`}
            </p>
          </div>

          {totalPendingCount > 0 && (
            <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {totalPendingCount}
            </div>
          )}
        </header>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("important")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "important"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Important Tasks</span>
            {importantCount > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[11px] font-bold text-primary">
                {importantCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("other")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "other"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Other Tasks</span>
            {otherTasksCount > 0 && (
              <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[11px] font-bold text-foreground">
                {otherTasksCount}
              </span>
            )}
          </button>
        </div>

        {totalPendingCount === 0 ? (
          <Card className="mt-8 rounded-3xl border-border bg-card shadow-xs">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>

              <h2 className="mt-3.5 text-base font-semibold text-foreground">
                No pending tasks
              </h2>

              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                All tasks are completed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8">
            <AnimatePresence mode="wait">
              {activeTab === "important" ? (
                <motion.section
                  key="important"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  <div ref={overdueRef}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-red-400">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                        <span>Overdue</span>
                      </h2>
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                        {overdueCount}
                      </span>
                    </div>

                    {overdueTasks.length === 0 ? (
                      <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="p-4 text-center text-xs text-muted-foreground">
                          No overdue tasks.
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
                      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-orange-400">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                        <span>Due Today</span>
                      </h2>
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                        {dueTodayCount}
                      </span>
                    </div>

                    {dueTodayTasks.length === 0 ? (
                      <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="p-4 text-center text-xs text-muted-foreground">
                          No tasks due today.
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
                      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-yellow-400">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500 shrink-0" />
                        <span>Tomorrow</span>
                      </h2>
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                        {tomorrowCount}
                      </span>
                    </div>

                    {tomorrowTasks.length === 0 ? (
                      <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="p-4 text-center text-xs text-muted-foreground">
                          No tasks due tomorrow.
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
                      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-blue-400">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                        <span>Remaining</span>
                      </h2>
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                        {remainingCount}
                      </span>
                    </div>

                    {remainingTasks.length === 0 ? (
                      <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="p-4 text-center text-xs text-muted-foreground">
                          No remaining tasks.
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
                </motion.section>
              ) : (
                <motion.section
                  key="other"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
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
                      <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="p-4 text-center text-xs text-muted-foreground">
                          No other tasks.
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
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        )}

        <ViewEntryDialog
          open={openView}
          onOpenChange={setOpenView}
          entry={selectedEntry}
          onEdit={(entry: Entry) => {
            setOpenView(false);
            setSelectedEntry(entry);
            setOpenEdit(true);
          }}
        />

        {selectedEntry && (
          <EditEntryDialog
            open={openEdit}
            onOpenChange={setOpenEdit}
            entry={selectedEntry}
          />
        )}
      </div>
    </main>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={null}>
      <PendingPageContent />
    </Suspense>
  );
}
