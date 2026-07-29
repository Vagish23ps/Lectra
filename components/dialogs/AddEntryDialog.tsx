"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Tag,
  ListTodo,
  StickyNote,
  CalendarDays,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Entry, WorkItem } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";
import { motion } from "framer-motion";
import { listVariants, itemVariants } from "@/lib/animations";

const createEmptyWork = (): WorkItem => ({
  id: crypto.randomUUID(),
  task: "",
  addToPending: false,
  deadline: "",
  completed: false,
});

export default function AddEntryDialog() {
  const addEntry = useEntryStore((state) => state.addEntry);

  const [open, setOpen] = useState(false);

  const [entryName, setEntryName] = useState("");
  const [subject, setSubject] = useState("");
  const [lesson, setLesson] = useState("");
  const [notes, setNotes] = useState("");

  const [works, setWorks] = useState<WorkItem[]>([]);

  const addWork = () => {
    setWorks((prev) => [...prev, createEmptyWork()]);
  };

  const removeWork = (id: string) => {
    setWorks((prev) => prev.filter((work) => work.id !== id));
  };

  const updateWork = (
    id: string,
    field: keyof WorkItem,
    value: string | boolean,
  ) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === id
          ? {
              ...work,
              [field]: value,
            }
          : work,
      ),
    );
  };

  const resetForm = () => {
    setEntryName("");
    setSubject("");
    setLesson("");
    setNotes("");

    setWorks([]);
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

    const entry: Entry = {
      id: crypto.randomUUID(),
      entryName: entryName.trim(),
      subject: subject.trim(),
      lesson: lesson.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      works,
    };

    addEntry(entry);

    resetForm();

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 w-full rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
          <Plus className="mr-2 h-5 w-5" />
          Add Entry
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
        {/* Header */}

        <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            Add New Entry
          </DialogTitle>

          <p className="text-sm text-muted-foreground">
            Capture notes, ideas and tasks in one place.
          </p>
        </DialogHeader>

        {/* Form */}

        <motion.div
          className="space-y-6 px-5 pb-5"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Entry Details */}

          <motion.section variants={itemVariants} className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Entry Name
              </label>

              <Input
                placeholder="Example: Math Class, Project Meeting, Personal Notes"
                value={entryName}
                onChange={(e) => setEntryName(e.target.value)}
                className="h-12 rounded-xl bg-background"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Subject / Category
              </label>

              <Input
                placeholder="Example: Project, College, Personal"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-12 rounded-xl bg-background"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Key Notes
              </label>

              <Textarea
                placeholder="Important points for this entry..."
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                className="min-h-28 resize-none rounded-xl bg-background"
              />
            </div>
          </motion.section>

          {/* Tasks */}

          <motion.section
            variants={itemVariants}
            className="border-t border-border pt-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <ListTodo className="h-4 w-4 text-primary" />
                  Tasks
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add actions related to this entry.
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

            <div className="space-y-3">
              {works.map((work, index) => (
                <motion.div
                  key={work.id}
                  layout
                  variants={itemVariants}
                  className="rounded-2xl border border-border bg-background/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Task {index + 1}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeWork(work.id)}
                      aria-label={`Remove task ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Input
                    placeholder="What needs to be done?"
                    value={work.task}
                    onChange={(e) =>
                      updateWork(work.id, "task", e.target.value)
                    }
                    className="h-11 rounded-xl bg-card"
                  />

                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={work.addToPending}
                      onChange={(e) =>
                        updateWork(work.id, "addToPending", e.target.checked)
                      }
                      className="h-4 w-4 accent-primary"
                    />

                    <span className="text-foreground">
                      Mark this task as important
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
                        value={work.deadline}
                        onChange={(e) =>
                          updateWork(work.id, "deadline", e.target.value)
                        }
                        className="h-11 rounded-xl bg-card"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Additional Notes */}

          <motion.section
            variants={itemVariants}
            className="border-t border-border pt-5"
          >
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Additional Notes
            </label>

            <Textarea
              placeholder="Anything else worth remembering?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 resize-none rounded-xl bg-background"
            />
          </motion.section>

          {/* Actions */}

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
            >
              Save Entry
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
