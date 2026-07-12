"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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

export default function AddEntryDialog() {
  const addEntry = useEntryStore((state) => state.addEntry);

  const [open, setOpen] = useState(false);

  const [entryName, setEntryName] = useState("");
  const [subject, setSubject] = useState("");
  const [lesson, setLesson] = useState("");
  const [notes, setNotes] = useState("");

  const [works, setWorks] = useState<WorkItem[]>([
    {
      id: crypto.randomUUID(),
      task: "",
      addToPending: false,
      deadline: "",
      completed: false,
    },
  ]);
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

  const entry: Entry = {
    id: crypto.randomUUID(),
    entryName,
    subject,
    lesson,
    notes,
    createdAt: new Date().toISOString(),
    works,
  };

  addEntry(entry);

  // Reset form
  setEntryName("");
  setSubject("");
  setLesson("");
  setNotes("");

  setWorks([
    {
      id: crypto.randomUUID(),
      task: "",
      addToPending: false,
      deadline: "",
      completed: false,
    },
  ]);

  setOpen(false);
};
    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 rounded-2xl bg-blue-600">
          <Plus className="mr-2 h-5 w-5" />
          Add Entry
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-5"></div>
        <Input
  placeholder="Entry Name (Example: Second Hour)"
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

  <div className="flex items-center justify-between mb-3">

    <h3 className="font-semibold">
      Assigned Work
    </h3>

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
      className="rounded-xl border p-4 mb-4 space-y-3"
    >

      <p className="font-medium">
        Assignment {index + 1}
      </p>

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

        Add to Pending List

      </label>
            {work.addToPending && (

              <div className="space-y-2">

                <label className="text-sm font-medium text-slate-600">
                  Deadline
                  <span className="text-slate-400 font-normal">
                    {" "} (Optional)
                  </span>
                </label>

                <Input
                  type="date"
                  value={work.deadline}
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
    </div>
  ))}
</div>

<Textarea
  placeholder="Important Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>
<div className="flex gap-3 pt-2">

  <Button
    type="button"
    variant="outline"
    className="flex-1"
    onClick={() => setOpen(false)}
  >
    Cancel
  </Button>

  <Button
    type="button"
    className="flex-1 bg-blue-600 hover:bg-blue-700"
    onClick={handleSave}
  >
    Save Entry
  </Button>

</div>
      </DialogContent>
    </Dialog>
  );
}
