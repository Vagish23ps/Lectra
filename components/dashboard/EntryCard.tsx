"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle2,
  Clock3,
  ListTodo,
  Bell,
  Paperclip,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const allTags = useAllTags();
  const tagMap = useMemo(() => new Map(allTags.map((t) => [t.id, t.name])), [allTags]);

  const assignedCount = entry.works.filter(
    (work) => work.task.trim() !== "",
  ).length;

  const completedCount = entry.works.filter((work) => work.completed).length;

  const pendingCount = entry.works.filter(
    (work) => work.addToPending && !work.completed,
  ).length;

  const attachmentCount = entry.attachments?.length || 0;

  const createdDateTime = new Date(entry.createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

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
      <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm transition-all hover:border-primary/50">
        <CardContent className="p-4 sm:p-5">
          {/* Entry Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {entry.entryName || "Untitled Entry"}
                </h2>

                <p className="mt-0.5 truncate text-xs font-medium text-primary sm:text-sm">
                  {entry.subject || "No subject"}
                </p>
              </div>
            </div>

            {/* Task Count Badge */}
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                <ListTodo className="h-3.5 w-3.5 text-primary" />
                <span>
                  {assignedCount} {assignedCount === 1 ? "Task" : "Tasks"}
                </span>
              </div>
            </div>
          </div>

          {/* Status Pills (Reminders, Attachments, Completed, Important) */}
          {(completedCount > 0 || pendingCount > 0 || entry.reminder || attachmentCount > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {entry.reminder && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Bell className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{formatReminderSummary(entry.reminder)}</span>
                </div>
              )}

              {attachmentCount > 0 && (
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

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {entry.tags.map((tagId) => {
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

          {/* Key Notes */}
          <div className="mt-4 border-t border-border/80 pt-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Key Notes
              </span>

              <span className="text-[11px] text-muted-foreground">{createdDateTime}</span>
            </div>

            {entry.lesson.trim() ? (
              <p className="line-clamp-3 text-xs leading-relaxed text-foreground/90 sm:text-sm">
                {entry.lesson}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No key notes added.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-xl text-xs font-medium"
              onClick={() => setOpenView(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-xl text-xs font-medium"
              onClick={() => setOpenEdit(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="h-9 w-full rounded-xl text-xs font-medium"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
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

      <EditEntryDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        entry={entry}
      />
    </>
  );
}