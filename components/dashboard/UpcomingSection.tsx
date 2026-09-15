"use client";

import { useState } from "react";
import { Bell, CheckSquare, ChevronRight, Repeat, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { UpcomingItem, useUpcomingItems } from "@/hooks/useUpcomingItems";
import { useEntryStore } from "@/store/entryStore";
import { cardVariants, tabContentVariants } from "@/lib/animations";

interface UpcomingSectionProps {
  onItemClick: (item: UpcomingItem) => void;
}

export default function UpcomingSection({ onItemClick }: UpcomingSectionProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "reminders">("tasks");
  const { taskItems, reminderItems, hasTaskItems, hasReminderItems } = useUpcomingItems();
  const toggleWorkCompleted = useEntryStore((state) => state.toggleWorkCompleted);

  const currentItems = activeTab === "tasks" ? taskItems : reminderItems;
  const currentHasItems = activeTab === "tasks" ? hasTaskItems : hasReminderItems;

  return (
    <section className="mt-6 sm:mt-7">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          Upcoming
        </h3>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-2xl bg-secondary/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
              activeTab === "tasks"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tasks</span>
            {hasTaskItems && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {taskItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reminders")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
              activeTab === "reminders"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Reminders</span>
            {hasReminderItems && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {reminderItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-3"
        >
          {!currentHasItems ? (
            <Card className="rounded-2xl sm:rounded-3xl border-border bg-card shadow-xs">
              <CardContent className="flex items-center justify-center p-4 sm:p-5 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {activeTab === "tasks" ? "No upcoming tasks." : "No upcoming reminders."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              <AnimatePresence mode="popLayout">
                {currentItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Card
                      onClick={() => onItemClick(item)}
                      className="cursor-pointer rounded-2xl sm:rounded-3xl border-border bg-card shadow-xs transition-all hover:border-primary/50 active:scale-[0.99]"
                    >
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {item.type === "task" && item.workId ? (
                              <button
                                type="button"
                                aria-label="Complete task"
                                title="Mark task complete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWorkCompleted(item.entryId, item.workId!);
                                }}
                                className={`group/chk flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border transition-all hover:scale-105 active:scale-95 ${item.badgeClass} hover:border-emerald-500 hover:bg-emerald-500/10`}
                              >
                                <Check className="h-4 w-4 transition-transform group-hover/chk:scale-110" />
                              </button>
                            ) : (
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border ${item.badgeClass}`}
                              >
                                <Bell className="h-4 w-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${item.textClass}`}
                                >
                                  {item.categoryLabel}
                                </span>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                                  {item.formattedDue}
                                </span>

                                {item.isRecurring && item.recurrenceText && (
                                  <>
                                    <span className="text-[10px] text-muted-foreground">•</span>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      <Repeat className="h-2.5 w-2.5" />
                                      {item.recurrenceText}
                                    </span>
                                  </>
                                )}
                              </div>

                              <h4 className="mt-0.5 truncate text-xs sm:text-sm font-semibold text-foreground">
                                {item.title}
                              </h4>

                              {item.entryTitle && item.entryTitle !== item.title && (
                                <p className="truncate text-[11px] text-muted-foreground/80">
                                  {item.entryTitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="h-4.5 w-4.5 shrink-0 text-muted-foreground/70" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
