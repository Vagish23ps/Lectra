"use client";

import { Eye, Pencil, Trash2, BookOpen, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ViewEntryDialog from "@/components/dialogs/ViewEntryDialog";

import { Entry } from "@/types/entry";
import EditEntryDialog from "@/components/dialogs/EditEntryDialog";
import { useEntryStore } from "@/store/entryStore";

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({
  entry,
}: EntryCardProps) {
    const assignedCount = entry.works.filter(
      (work) => work.task.trim() !== ""
    ).length;

    const completedCount = entry.works.filter(
      (work) => work.completed
    ).length;

    const pendingCount = entry.works.filter(
      (work) => work.addToPending && !work.completed
    ).length;
    const [openView, setOpenView] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const deleteEntry = useEntryStore((state) => state.deleteEntry);

    const handleDelete = () => {
      const confirmed = window.confirm(
        `Delete "${entry.entryName}"? This action cannot be undone.`
      );

      if (!confirmed) return;

      deleteEntry(entry.id);
    };
  return (
    <Card className="rounded-3xl bg-[#111827] border-slate-700 hover:border-blue-500 transition-all duration-300">

      <CardContent className="py-5">

        <div className="flex items-start justify-between">

          <div>

            <h2 className="text-lg font-bold flex items-center gap-2">

              <BookOpen size={18} />

              {entry.entryName}

            </h2>

            <p className="text-blue-400 mt-1">

              {entry.subject}

            </p>

          </div>

          <div className="text-right space-y-1">

            <p className="text-xs text-slate-400">
              {assignedCount} Assigned
            </p>

            <p className="text-xs text-green-400">
              {completedCount} Completed
            </p>

            <p className="text-xs text-orange-400">
              {pendingCount} Pending
            </p>

          </div>

        </div>

        <div className="mt-5">

          <p className="text-sm text-slate-500 mb-1">

            Today's Lesson

          </p>

          <p className="text-slate-200">

            {entry.lesson}

          </p>

        </div>

        <div className="mt-6 flex justify-between">

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenView(true)}
            >
            <Eye className="mr-2 h-4 w-4" />
            View
            </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenEdit(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
  
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>

        </div>

      </CardContent>
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
    </Card>
  );
}