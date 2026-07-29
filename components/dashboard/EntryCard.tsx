"use client";

import { useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle2,
  Clock3,
  ListTodo,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import ViewEntryDialog from "@/components/dialogs/ViewEntryDialog";
import EditEntryDialog from "@/components/dialogs/EditEntryDialog";

import { Entry } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const deleteEntry = useEntryStore((state) => state.deleteEntry);

  const assignedCount = entry.works.filter(
    (work) => work.task.trim() !== ""
  ).length;

  const completedCount = entry.works.filter(
    (work) => work.completed
  ).length;

  const pendingCount = entry.works.filter(
    (work) => work.addToPending && !work.completed
  ).length;

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${entry.entryName || "Untitled Entry"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteEntry(entry.id);
  };

  return (
    <>
      <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm transition-colors hover:border-primary/50">
        <CardContent className="p-5">
          {/* Entry Header */}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </span>

                <span className="truncate">
                  {entry.entryName || "Untitled Entry" }
                </span>
              </h2>

              <p className="mt-2 text-sm font-medium text-primary">
                {entry.subject || "No subject"}
              </p>
            </div>

            {/* Task Count */}

            <div className="shrink-0">
              <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <ListTodo className="h-3.5 w-3.5" />

                <span>
                  {assignedCount}{" "}
                  {assignedCount === 1 ? "Task" : "Tasks"}
                </span>
              </div>
            </div>
          </div>

          {/* Task Status */}

          {(completedCount > 0 || pendingCount > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {completedCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />

                  <span>
                    {completedCount} Completed
                  </span>
                </div>
              )}

              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  <Clock3 className="h-3.5 w-3.5" />

                  <span>
                    {pendingCount} Important
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Key Notes */}

          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Key Notes
            </p>

            {entry.lesson.trim() ? (
              <p className="line-clamp-3 text-sm leading-6 text-foreground/90">
                {entry.lesson}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No key notes added.
              </p>
            )}
          </div>

          {/* Actions */}

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => setOpenView(true)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => setOpenEdit(true)}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="w-full rounded-xl"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <ViewEntryDialog
        open={openView}
        onOpenChange={setOpenView}
        entry={entry}
      />

      <EditEntryDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        entry={entry}
      />
    </>
  );
}