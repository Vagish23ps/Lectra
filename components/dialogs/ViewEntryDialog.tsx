"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Entry } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";

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
            ? { ...work, completed: !work.completed }
            : work
        ),
      };

      updateEntry(updatedEntry);
    };

  if (!entry) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">

        <DialogHeader>

          <DialogTitle className="text-2xl">

            📖 {entry.entryName}

          </DialogTitle>

        </DialogHeader>
        <div className="space-y-6">

          <div>

            <p className="text-sm text-slate-400">

              Subject

            </p>

            <p className="text-lg font-semibold text-blue-500">

              {entry.subject}

            </p>

          </div>

          <div>

            <h3 className="font-semibold">

              📚 Today's Lesson

            </h3>

            <p className="mt-2 text-slate-300">

              {entry.lesson}

            </p>

          </div>
                  <div>

            <h3 className="font-semibold mb-3">

              📝 Assigned Work

            </h3>

            <div className="space-y-3">

              {entry.works.map((work) => (

                <div
                  key={work.id}
                  className="rounded-xl border border-slate-700 p-4"
                >

                  <button
                    type="button"
                    onClick={() => toggleWorkCompleted(work.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    <span>
                      {work.completed ? "✅" : "⬜"}
                    </span>

                    <span
                      className={
                        work.completed
                          ? "text-slate-500 line-through"
                          : ""
                      }
                    >
                      {work.task}
                    </span>
                  </button>

                  {work.addToPending && (

                    <p className="text-sm text-orange-400 mt-2">

                      Deadline: {work.deadline || "Not Set"}

                    </p>

                  )}

                </div>

              ))}

            </div>

          </div>
                  <div>

            <h3 className="font-semibold">

              🗒 Personal Notes

            </h3>

            <p className="mt-2 text-slate-300">

              {entry.notes || "No notes added."}

            </p>

          </div>

          <div>

            <h3 className="font-semibold">

              🕒 Created

            </h3>

            <p className="mt-2 text-slate-400">

              {new Date(entry.createdAt).toLocaleString()}

            </p>

          </div>

        </div>

      </DialogContent>

    </Dialog>

  );

}