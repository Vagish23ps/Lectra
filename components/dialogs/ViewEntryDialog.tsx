"use client";

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  ListTodo,
  StickyNote,
  Tag,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Entry } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";
import { motion } from "framer-motion";

import { listVariants, itemVariants } from "@/lib/animations";

interface ViewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Entry | null;
}

export default function ViewEntryDialog({
  open,
  onOpenChange,
  entry,
}: ViewEntryDialogProps) {
  const updateEntry = useEntryStore((state) => state.updateEntry);

  const toggleWorkCompleted = (workId: string) => {
    if (!entry) return;

    const updatedEntry: Entry = {
      ...entry,
      works: entry.works.map((work) =>
        work.id === workId
          ? {
              ...work,
              completed: !work.completed,
            }
          : work,
      ),
    };

    updateEntry(updatedEntry);
  };

  if (!entry) return null;

  const validWorks = entry.works.filter((work) => work.task.trim() !== "");

  const completedCount = validWorks.filter((work) => work.completed).length;

  const pendingCount = validWorks.filter(
    (work) => work.addToPending && !work.completed,
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
        {/* Header */}

        <DialogHeader className="border-b border-border px-5 pb-5 pt-5">
          <div className="flex items-start gap-3 pr-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-7 tracking-tight text-foreground">
                {entry.entryName || "Untitled Entry"}
              </DialogTitle>

              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary">
                <Tag className="h-3.5 w-3.5" />

                <span className="break-words">
                  {entry.subject || "No subject"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Entry Content */}

        <motion.div
          className="space-y-6 px-5 pb-5"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Key Notes */}

          <motion.section variants={itemVariants}>
            <div className="mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />

              <h3 className="font-semibold text-foreground">Key Notes</h3>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {entry.lesson.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {entry.lesson}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No key notes added.
                </p>
              )}
            </div>
          </motion.section>

          {/* Tasks */}

          <motion.section
            variants={itemVariants}
            className="border-t border-border pt-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />

                  <h3 className="font-semibold text-foreground">Tasks</h3>
                </div>

                {validWorks.length > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Tap a task to mark it as completed.
                  </p>
                )}
              </div>

              {validWorks.length > 0 && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {completedCount}/{validWorks.length}
                </span>
              )}
            </div>

            {validWorks.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                <ListTodo className="mx-auto h-6 w-6 text-muted-foreground" />

                <p className="mt-2 text-sm text-muted-foreground">
                  No tasks added to this entry.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {validWorks.map((work) => (
                  <motion.div
                    key={work.id}
                    layout
                    variants={itemVariants}
                    animate={{
                      scale: work.completed ? 0.995 : 1,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className={`rounded-2xl border p-4 transition-colors ${
                      work.completed
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-border bg-background/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleWorkCompleted(work.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <motion.div
                        animate={{
                          scale: work.completed ? [1, 1.25, 1] : 1,
                          rotate: work.completed ? [0, 10, -10, 0] : 0,
                        }}
                        transition={{ duration: 0.35 }}
                      >
                        {work.completed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                      </motion.div>
                      <motion.span
                        animate={{
                          opacity: work.completed ? 0.65 : 1,
                          scale: work.completed ? 0.98 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                        className={`min-w-0 flex-1 text-sm leading-6 ${
                          work.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {work.task}
                      </motion.span>
                    </button>

                    {work.addToPending && (
                      <div className="mt-3 flex items-center gap-2 border-t border-border/70 pt-3 text-xs">
                        <Clock3
                          className={`h-3.5 w-3.5 ${
                            work.completed ? "text-green-400" : "text-amber-400"
                          }`}
                        />

                        <span
                          className={
                            work.completed ? "text-green-400" : "text-amber-400"
                          }
                        >
                          {work.completed
                            ? "Completed"
                            : `Deadline: ${
                                work.deadline
                                  ? new Date(work.deadline).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )
                                  : "Not set"
                              }`}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {pendingCount > 0 && (
              <p className="mt-3 text-xs text-amber-400">
                {pendingCount} {pendingCount === 1 ? "task is" : "tasks are"}{" "}
                still pending.
              </p>
            )}
          </motion.section>

          {/* Additional Notes */}

          <motion.section
            variants={itemVariants}
            className="border-t border-border pt-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />

              <h3 className="font-semibold text-foreground">
                Additional Notes
              </h3>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {entry.notes.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {entry.notes}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No additional notes added.
                </p>
              )}
            </div>
          </motion.section>

          {/* Created Date */}

          <section className="border-t border-border pt-5">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Created</p>

                <p className="mt-2 text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
