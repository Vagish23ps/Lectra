"use client";

import { useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle2,
  Clock3,
  ListTodo,
  Bell,
  Paperclip,
  MoreVertical,
  Check,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ViewEntryDialog from "@/components/dialogs/ViewEntryDialog";
import EditEntryDialog from "@/components/dialogs/EditEntryDialog";

import { Entry } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";
import { useAllTags } from "@/store/tagStore";
import { formatReminderSummary } from "@/components/reminders/ReminderSummary";
import { toast } from "sonner";

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const deleteEntry = useEntryStore((state) => state.deleteEntry);
  const toggleWorkCompleted = useEntryStore((state) => state.toggleWorkCompleted);
  const allTags = useAllTags();
  const tagMap = useMemo(() => new Map(allTags.map((t) => [t.id, t.name])), [allTags]);

  const activeWorks = entry.works.filter(
    (work) => work.task.trim() !== "",
  );
  const assignedCount = activeWorks.length;
  const completedCount = entry.works.filter((work) => work.completed).length;
  const pendingCount = entry.works.filter(
    (work) => work.addToPending && !work.completed,
  ).length;

  const attachmentCount = entry.attachments?.length || 0;

  const hasCategory = Boolean(
    entry.subject &&
    entry.subject.trim() !== "" &&
    entry.subject.trim().toLowerCase() !== "general",
  );

  const hasTags = Boolean(entry.tags && entry.tags.length > 0);
  const hasReminder = Boolean(entry.reminder);
  const hasAttachments = attachmentCount > 0;
  const hasDetails = Boolean(entry.lesson && entry.lesson.trim() !== "");
  const hasTasks = assignedCount > 0;
  const hasStatusPills = completedCount > 0 || pendingCount > 0 || hasReminder || hasAttachments;

  const handleDelete = () => {
    const deletedEntry = { ...entry };
    deleteEntry(entry.id);
    toast("Entry deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          useEntryStore.getState().addEntry(deletedEntry);
          toast.success("Entry restored.");
        },
      },
      duration: 5000,
    });
  };

  return (
    <>
      <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-xs transition-all hover:border-primary/50">
        <CardContent className="p-0">
          {/* Tappable Card Body (Opens View Dialog) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setOpenView(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenView(true);
              }
            }}
            className="w-full cursor-pointer p-4 text-left transition-transform active:scale-[0.99] focus-visible:outline-none sm:p-5"
          >
            {/* Header: Icon + Title + (Optional Category) + Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
                  <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg break-words">
                    {entry.entryName || "Untitled Entry"}
                  </h2>

                  {hasCategory && (
                    <p className="mt-0.5 truncate text-xs font-medium text-primary sm:text-sm">
                      {entry.subject}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Actions: Edit button + Kebab menu */}
              <div className="flex shrink-0 items-center gap-1">
                {hasTasks && (
                  <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground mr-0.5">
                    <ListTodo className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {assignedCount} {assignedCount === 1 ? "Task" : "Tasks"}
                    </span>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenEdit(true);
                  }}
                  aria-label="Edit entry"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="gap-2 rounded-lg text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Entry
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Task Preview (1-Tap Task Completion) */}
            {hasTasks && (
              <div className="mt-3 space-y-1 border-t border-border/60 pt-2.5">
                {activeWorks.slice(0, 2).map((work) => (
                  <div
                    key={work.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWorkCompleted(entry.id, work.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWorkCompleted(entry.id, work.id);
                      }
                    }}
                    className="group/task flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1 -mx-2 text-xs transition-colors hover:bg-secondary/60 active:scale-[0.99]"
                  >
                    <span
                      className={`flex h-4.5 w-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        work.completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/40 bg-background group-hover/task:border-primary"
                      }`}
                    >
                      {work.completed && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <span
                      className={`truncate ${
                        work.completed
                          ? "line-through text-muted-foreground"
                          : "font-medium text-foreground"
                      }`}
                    >
                      {work.task}
                    </span>
                  </div>
                ))}
                {assignedCount > 2 && (
                  <p className="text-[11px] font-medium text-muted-foreground pl-1">
                    +{assignedCount - 2} more
                  </p>
                )}
              </div>
            )}

            {/* Status Pills (Only if any active status exists) */}
            {hasStatusPills && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {hasReminder && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <Bell className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{formatReminderSummary(entry.reminder!)}</span>
                  </div>
                )}
                {hasAttachments && (
                  <div className="flex items-center gap-1.5 rounded-full bg-secondary/90 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>
                      {attachmentCount} {attachmentCount === 1 ? "Attachment" : "Attachments"}
                    </span>
                  </div>
                )}
                {completedCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{completedCount} Completed</span>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                    <span>{pendingCount} Important</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags (Only if tags exist) */}
            {hasTags && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {entry.tags!.map((tagId) => {
                  const tagName = tagMap.get(tagId) || tagId;
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center rounded-lg border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      #{tagName}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Details / Notes (Only if details exist - no timestamp, no "No details added") */}
            {hasDetails && (
              <div className="mt-3 border-t border-border/80 pt-2.5">
                <p className="line-clamp-3 text-xs leading-relaxed text-foreground/90 sm:text-sm">
                  {entry.lesson}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ViewEntryDialog
        open={openView}
        onOpenChange={setOpenView}
        entry={entry}
        onEdit={() => {
          setOpenView(false);
          setOpenEdit(true);
        }}
      />
      <EditEntryDialog open={openEdit} onOpenChange={setOpenEdit} entry={entry} />
    </>
  );
}