"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Entry, WorkItem } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";

interface EditEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Entry;
}

export default function EditEntryDialog({
  open,
  onOpenChange,
  entry,
}: EditEntryDialogProps) {
  const updateEntry = useEntryStore((state) => state.updateEntry);

  const [entryName, setEntryName] = useState("");
  const [subject, setSubject] = useState("");
  const [lesson, setLesson] = useState("");
  const [notes, setNotes] = useState("");
  const [works, setWorks] = useState<WorkItem[]>([]);

  useEffect(() => {
    if (open) {
      setEntryName(entry.entryName);
      setSubject(entry.subject);
      setLesson(entry.lesson);
      setNotes(entry.notes);
      setWorks(entry.works.map((work) => ({ ...work })));
    }
  }, [entry, open]);

  const addWork = () => {
    setWorks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        task: "",
        addToPending: false,
        deadline: "",
        completed: false,
      },
    ]);
  };

  const removeWork = (id: string) => {
    setWorks((prev) => prev.filter((work) => work.id !== id));
  };

  const updateWork = (
    id: string,
    field: keyof WorkItem,
    value: string | boolean
  ) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === id
          ? {
              ...work,
              [field]: value,
            }
          : work
      )
    );
  };

  const handleSave = () => {
    if (!entryName.trim() || !subject.trim()) {
      alert("Entry Name and Subject are required.");
      return;
    }

    const updatedEntry: Entry = {
      ...entry,
      entryName: entryName.trim(),
      subject: subject.trim(),
      lesson: lesson.trim(),
      notes: notes.trim(),
      works,
    };

    updateEntry(updatedEntry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <Input
            placeholder="Entry Name"
            value={entryName}
            onChange={(e) => setEntryName(e.target.value)}
          />

          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            placeholder="Today's Lesson / Concept"
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
          />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Assigned Work</h3>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addWork}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>

            {works.map((work, index) => (
              <div
                key={work.id}
                className="mb-4 space-y-3 rounded-xl border p-4"
              >
                <p className="font-medium">Task {index + 1}</p>

                <Input
                  placeholder="Task Description"
                  value={work.task}
                  onChange={(e) =>
                    updateWork(work.id, "task", e.target.value)
                  }
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={work.addToPending}
                    onChange={(e) =>
                      updateWork(
                        work.id,
                        "addToPending",
                        e.target.checked
                      )
                    }
                  />

                  Add to Pending Work
                </label>

                {work.addToPending && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Deadline (Optional)
                    </p>

                    <Input
                      type="date"
                      value={work.deadline || ""}
                      onChange={(e) =>
                        updateWork(
                          work.id,
                          "deadline",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}

                {works.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeWork(work.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Textarea
            placeholder="Important Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}