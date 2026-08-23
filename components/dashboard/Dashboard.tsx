"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarDays,
  ClipboardList,
  ChevronRight,
  ListTodo,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import AddEntryDialog from "@/components/dialogs/AddEntryDialog";
import EditEntryDialog from "@/components/dialogs/EditEntryDialog";
import ViewEntryDialog from "@/components/dialogs/ViewEntryDialog";
import { useEntryStore } from "@/store/entryStore";
import { Entry } from "@/types/entry";
import EntryCard from "./EntryCard";

import NotificationBell from "@/components/notifications/NotificationBell";
import { usePendingTasks } from "@/hooks/usePendingTasks";
import { pageVariants, itemVariants, listVariants } from "@/lib/animations";

function DashboardContent() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [highlightWorkId, setHighlightWorkId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const entries = useEntryStore((state) => state.entries);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Handle deep-linking to specific entry/task
  useEffect(() => {
    const viewEntryId = searchParams.get("viewEntry");
    const workId = searchParams.get("workId");

    if (viewEntryId && entries.length > 0) {
      const target = entries.find((e) => e.id === viewEntryId);
      if (target) {
        setViewingEntry(target);
        setHighlightWorkId(workId || null);
        setOpenViewDialog(true);
        // Replace URL so refreshing or back navigation does not re-open the entry
        window.history.replaceState(null, "", "/");
      }
    }
  }, [searchParams, entries]);

  // Keep viewingEntry in sync with store changes
  useEffect(() => {
    if (viewingEntry) {
      const updated = entries.find((e) => e.id === viewingEntry.id);
      if (updated) {
        setViewingEntry(updated);
      }
    }
  }, [entries, viewingEntry]);

  const today = currentDate ? format(currentDate, "EEEE, dd MMMM yyyy") : "";

  const greeting = "Hi there..!";

  const todayEntries = currentDate
    ? entries.filter(
        (entry) =>
          format(new Date(entry.createdAt), "yyyy-MM-dd") ===
          format(currentDate, "yyyy-MM-dd"),
      )
    : [];
  const {
    overdueCount,
    dueTodayCount,
    tomorrowCount,
    remainingCount,
    otherTasksCount,
    totalPendingCount,
  } = usePendingTasks();

  const pendingCards = [
    {
      title: "Overdue",
      count: overdueCount,
      href: "/pending?tab=important&section=overdue",
      className: "border-red-500/20 bg-red-500/5 hover:border-red-500/40",
      textClass: "text-red-500 dark:text-red-400",
    },
    {
      title: "Due Today",
      count: dueTodayCount,
      href: "/pending?tab=important&section=today",
      className:
        "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40",
      textClass: "text-orange-500 dark:text-orange-400",
    },
    {
      title: "Tomorrow",
      count: tomorrowCount,
      href: "/pending?tab=important&section=tomorrow",
      className: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
      textClass: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Remaining",
      count: remainingCount,
      href: "/pending?tab=important&section=remaining",
      className: "border-border bg-card hover:border-primary/40",
      textClass: "text-foreground",
    },
    {
      title: "Other Tasks",
      count: otherTasksCount,
      href: "/pending?tab=other&section=other",
      className: "border-border bg-card hover:border-primary/40",
      textClass: "text-foreground",
    },
  ];

  const handleOpenEditFromView = (entry: Entry) => {
    setOpenViewDialog(false);
    setEditingEntry(entry);
    setOpenEditDialog(true);
  };

  return (
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Brand Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-md shadow-primary/20">
              <img
                src="/favicon.png"
                alt="Lectra Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Lectra
              </h1>
              <p className="text-xs text-muted-foreground">
                Capture Today. Recall Anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push("/settings")}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-secondary active:scale-95"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-foreground" />
            </button>

            <NotificationBell />
          </div>
        </header>

        {/* Greeting & Date */}
        <section className="mt-5 sm:mt-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting}
          </h2>

          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{today || "Loading date..."}</span>
          </div>
        </section>

        {/* Add Entry CTA */}
        <section className="mt-5 sm:mt-6">
          <AddEntryDialog />
        </section>

        {/* Today's Entries */}
        <section className="mt-6 sm:mt-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Today&apos;s Entries
              </h3>

              {todayEntries.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {todayEntries.length}{" "}
                  {todayEntries.length === 1 ? "entry" : "entries"} captured today
                </p>
              )}
            </div>

            {todayEntries.length > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                {todayEntries.length}
              </span>
            )}
          </div>

          {todayEntries.length === 0 ? (
            <Card className="mt-3.5 rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="flex flex-col items-center px-5 py-8 text-center sm:py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <ClipboardList className="h-6 w-6" />
                </div>

                <h4 className="mt-3 text-sm font-semibold text-foreground sm:text-base">
                  Nothing captured yet
                </h4>

                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Add your first entry and start building your daily timeline.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-3.5 space-y-3 sm:space-y-4">
              <AnimatePresence mode="popLayout">
                {todayEntries.map((entry) => (
                  <div key={entry.id}>
                    <EntryCard entry={entry} />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Pending Overview */}
        <section className="mt-6 sm:mt-7">
          <Card
            onClick={() => router.push("/pending?tab=important")}
            className="cursor-pointer rounded-3xl border-border bg-card shadow-sm transition-all hover:border-primary/50 active:scale-[0.99]"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      overdueCount > 0
                        ? "bg-red-500/10 text-red-500 dark:text-red-400"
                        : dueTodayCount > 0
                          ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                          : tomorrowCount > 0
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-green-500/10 text-green-500 dark:text-green-400"
                    }`}
                  >
                    <ListTodo className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">
                      Pending List
                    </h4>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {totalPendingCount === 0
                        ? "No pending tasks"
                        : `${totalPendingCount} Pending ${
                            totalPendingCount === 1 ? "Task" : "Tasks"
                          }`}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5 sm:gap-2.5">
                {pendingCards.map((card, index) => {
                  const isLastOddCard =
                    pendingCards.length % 2 === 1 &&
                    index === pendingCards.length - 1;

                  return (
                    <div
                      key={card.title}
                      className={
                        isLastOddCard
                          ? "col-span-2 flex justify-center sm:col-span-1 sm:block"
                          : ""
                      }
                    >
                      <div
                        className={
                          isLastOddCard
                            ? "w-full max-w-[170px] sm:max-w-none"
                            : "w-full"
                        }
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(card.href);
                          }}
                          className={`cursor-pointer rounded-2xl border p-2.5 sm:p-3 transition-colors active:scale-95 ${card.className}`}
                        >
                          <p
                            className={`text-[11px] sm:text-xs font-medium truncate ${card.textClass}`}
                          >
                            {card.title}
                          </p>

                          <p
                            className={`mt-0.5 text-base sm:text-lg font-bold ${card.textClass}`}
                          >
                            {card.count}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Deep-Linked View and Edit Dialogs */}
        <ViewEntryDialog
          open={openViewDialog}
          onOpenChange={setOpenViewDialog}
          entry={viewingEntry}
          highlightWorkId={highlightWorkId}
          onEdit={handleOpenEditFromView}
        />

        {editingEntry && (
          <EditEntryDialog
            open={openEditDialog}
            onOpenChange={setOpenEditDialog}
            entry={editingEntry}
          />
        )}
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
