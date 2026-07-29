"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useEntryStore } from "@/store/entryStore";
import EntryCard from "./EntryCard";

import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useNotificationStore } from "@/store/notificationStore";
import { usePendingTasks } from "@/hooks/usePendingTasks";
import { pageVariants, itemVariants, listVariants } from "@/lib/animations";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const router = useRouter();
  const entries = useEntryStore((state) => state.entries);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

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
      textClass: "text-red-400",
    },
    {
      title: "Due Today",
      count: dueTodayCount,
      href: "/pending?tab=important&section=today",
      className:
        "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40",
      textClass: "text-orange-400",
    },
    {
      title: "Tomorrow",
      count: tomorrowCount,
      href: "/pending?tab=important&section=tomorrow",
      className: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
      textClass: "text-amber-400",
    },
    {
      title: "Remaining",
      count: remainingCount,
      href: "/pending?tab=important&section=remaining",
      className: "border-border bg-background/60 hover:border-primary/40",
      textClass: "text-foreground",
    },
    {
      title: "Other Tasks",
      count: otherTasksCount,
      href: "/pending?tab=other&section=other",
      className: "border-border bg-background/60 hover:border-primary/40",
      textClass: "text-foreground",
    },
  ];

  return (
    <motion.main
      className="min-h-screen bg-background px-5 pb-8 pt-7 text-foreground"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once: true }}
    >
      <div className="mx-auto w-full max-w-4xl">
        {/* Brand */}
        <motion.header
          className="flex items-start justify-between gap-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary/20">
              <img
                src="/favicon.png"
                alt="Lectra Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lectra</h1>
              <p className="text-sm text-muted-foreground">
                Capture Today. Recall Anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-foreground" />
            </button>

            <NotificationBell onClick={() => setNotificationOpen(true)} />
          </div>
        </motion.header>

        {/* Greeting */}
        <motion.section className="mt-10" variants={itemVariants}>
          <h2 className="text-3xl font-bold tracking-tight">{greeting}</h2>

          <div className="mt-3 flex items-center gap-2 text-base text-muted-foreground">
            <CalendarDays className="h-5 w-5" />
            <span>{today || "Loading date..."}</span>
          </div>
        </motion.section>

        {/* Add Entry */}
        <motion.section className="mt-10" variants={itemVariants}>
          <AddEntryDialog />
        </motion.section>

        {/* Today's Entries */}
        <motion.section className="mt-10" variants={itemVariants}>
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
            <motion.div className="mt-5 space-y-4" variants={listVariants}>
              <AnimatePresence mode="popLayout">
                {todayEntries.map((entry) => (
                  <motion.div key={entry.id} variants={itemVariants} layout>
                    <EntryCard entry={entry} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>

        {/* Pending List */}
        <motion.section className="mt-8" variants={itemVariants}>
          <Card
            onClick={() => router.push("/pending?tab=important")}
            className="cursor-pointer rounded-3xl border-border bg-card transition-colors hover:border-primary/50"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      overdueCount > 0
                        ? "bg-red-500/10 text-red-400"
                        : dueTodayCount > 0
                          ? "bg-orange-500/10 text-orange-400"
                          : tomorrowCount > 0
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    <ListTodo className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground">
                      Pending List
                    </h4>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {totalPendingCount === 0
                        ? "No pending tasks"
                        : `${totalPendingCount} Pending ${
                            totalPendingCount === 1 ? "Task" : "Tasks"
                          }`}
                    </p>
                  </div>
                </div>

                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
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
                            : ""
                        }
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(card.href);
                          }}
                          className={`cursor-pointer rounded-2xl border p-3 transition-colors ${card.className}`}
                        >
                          <p
                            className={`text-xs font-medium ${card.textClass}`}
                          >
                            {card.title}
                          </p>

                          <p
                            className={`mt-1 text-lg font-bold ${card.textClass}`}
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
        </motion.section>

        <NotificationPanel
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />
      </div>
    </motion.main>
  );
}
