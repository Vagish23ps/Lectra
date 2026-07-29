"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  ListTodo,
  Plus,
  StickyNote,
  Tag,
  Trash2,
} from "lucide-react";

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
    setWorks((prev) =>
      prev.filter((work) => work.id !== id)
    );
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
   const hasTask = works.some((work) => work.task.trim());

      if (
        !entryName.trim() &&
        !subject.trim() &&
        !lesson.trim() &&
        !notes.trim() &&
        !hasTask
      ) {
        alert("Please add at least one note, task, or detail.");
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
        {/* Header */}

        <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            Edit Entry
          </DialogTitle>

          <p className="text-sm text-muted-foreground">
            Update your notes, category or tasks.
          </p>
        </DialogHeader>

        {/* Form */}

        <div className="space-y-6 px-5 pb-5">
          {/* Entry Details */}

          <section className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Entry Name
              </label>

              <Input
                placeholder="Entry Name"
                value={entryName}
                onChange={(e) =>
                  setEntryName(e.target.value)
                }
                className="h-12 rounded-xl bg-background"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Subject / Category
              </label>

              <Input
                placeholder="Subject / Category"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                className="h-12 rounded-xl bg-background"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Key Notes
              </label>

              <Textarea
                placeholder="Capture the important points..."
                value={lesson}
                onChange={(e) =>
                  setLesson(e.target.value)
                }
                className="min-h-28 resize-none rounded-xl bg-background"
              />
            </div>
          </section>

          {/* Tasks */}

          <section className="border-t border-border pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <ListTodo className="h-4 w-4 text-primary" />
                  Tasks
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Update or add actions related to this entry.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={addWork}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add
              </Button>
            </div>

            {works.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                <ListTodo className="mx-auto h-6 w-6 text-muted-foreground" />

                <p className="mt-2 text-sm text-muted-foreground">
                  No tasks added.
                </p>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={addWork}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {works.map((work, index) => (
                  <div
                    key={work.id}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        Task {index + 1}
                      </p>

                      {works.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            removeWork(work.id)
                          }
                          aria-label={`Remove task ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Input
                      placeholder="What needs to be done?"
                      value={work.task}
                      onChange={(e) =>
                        updateWork(
                          work.id,
                          "task",
                          e.target.value
                        )
                      }
                      className="h-11 rounded-xl bg-card"
                    />

                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
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
                        className="h-4 w-4 accent-primary"
                      />

                      <span className="text-foreground">
                        Add to Pending List
                      </span>
                    </label>

                    {work.addToPending && (
                      <div className="mt-4 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />

                          Deadline

                          <span className="font-normal text-muted-foreground">
                            (Optional)
                          </span>
                        </label>

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
                          className="h-11 rounded-xl bg-card"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Additional Notes */}

          <section className="border-t border-border pt-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Additional Notes
            </label>

            <Textarea
              placeholder="Anything else worth remembering?"
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              className="min-h-24 resize-none rounded-xl bg-background"
            />
          </section>

          {/* Actions */}

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
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