"use client";

import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Tag,
  ListTodo,
  StickyNote,
  CalendarDays,
  Paperclip,
  ImageIcon,
  X,
  Camera,
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
import { toast } from "sonner";
import { Entry, WorkItem, Attachment } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";
import { motion, AnimatePresence } from "framer-motion";
import { listVariants, itemVariants } from "@/lib/animations";
import { saveAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";
import TagSelector from "@/components/tags/TagSelector";
import ReminderSection from "@/components/reminders/ReminderSection";
import { CustomReminder } from "@/types/reminder";
import AttachmentThumbnail from "@/components/attachments/AttachmentThumbnail";
import PdfAttachmentCard from "@/components/attachments/PdfAttachmentCard";
import PhotoViewerModal from "@/components/attachments/PhotoViewerModal";
import PdfViewerModal from "@/components/attachments/PdfViewerModal";
import { formatAttachmentSummary } from "@/components/attachments/attachmentSummary";

const createEmptyWork = (): WorkItem => ({
  id: crypto.randomUUID(),
  task: "",
  addToPending: false,
  deadline: "",
  completed: false,
});

interface PendingAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  file: Blob | File;
  previewUrl?: string;
}

export default function AddEntryDialog() {
  const [open, setOpen] = useState(false);
  const addEntry = useEntryStore((state) => state.addEntry);

  const [entryName, setEntryName] = useState("");
  const [subject, setSubject] = useState("");
  const [lesson, setLesson] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [reminder, setReminder] = useState<CustomReminder | undefined>(undefined);

  const [works, setWorks] = useState<WorkItem[]>([]);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [previewPhoto, setPreviewPhoto] = useState<PendingAttachment | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PendingAttachment | null>(null);

  const addWork = () => {
    setWorks((prev) => [...prev, createEmptyWork()]);
  };

  const removeWork = (id: string) => {
    setWorks((prev) => prev.filter((work) => work.id !== id));
  };

  const updateWork = (
    id: string,
    field: keyof WorkItem,
    value: any,
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

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/svg+xml",
    ];

    const newItems: PendingAttachment[] = [];

    Array.from(files).forEach((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);

      if (!isPdf && !isImg && !allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" is unsupported. Only Photos and PDFs are supported.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 20MB limit.`);
        return;
      }

      const id = crypto.randomUUID();
      const previewUrl = (isImg || file.type.startsWith("image/"))
        ? URL.createObjectURL(file)
        : undefined;

      newItems.push({
        id,
        name: file.name,
        mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        size: file.size,
        createdAt: new Date().toISOString(),
        file,
        previewUrl,
      });
    });

    if (newItems.length > 0) {
      setAttachments((prev) => [...prev, ...newItems]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const resetForm = () => {
    setEntryName("");
    setSubject("");
    setLesson("");
    setNotes("");
    setTags([]);
    setReminder(undefined);
    setWorks([]);
    attachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setAttachments([]);
  };

  const handleSave = async () => {
    const hasTask = works.some((work) => work.task.trim());

    if (
      !entryName.trim() &&
      !subject.trim() &&
      !lesson.trim() &&
      !notes.trim() &&
      !hasTask &&
      !reminder &&
      attachments.length === 0 &&
      tags.length === 0
    ) {
      toast.error("Please add at least one note, task, detail, tag, reminder, or attachment.");
      return;
    }

    try {
      // Save binary files to IndexedDB
      for (const item of attachments) {
        await saveAttachmentFile(item.id, item.file);
      }

      const attachmentMetadata: Attachment[] = attachments.map((a) => ({
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt,
      }));

      const entry: Entry = {
        id: crypto.randomUUID(),
        entryName: entryName.trim(),
        subject: subject.trim(),
        lesson: lesson.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        works,
        attachments: attachmentMetadata.length > 0 ? attachmentMetadata : undefined,
        tags: tags.length > 0 ? tags : undefined,
        reminder,
      };

      addEntry(entry);
      toast.success("Entry created successfully.");

      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Error saving entry attachments:", err);
      toast.error("Failed to save entry attachments.");
    }
  };

  const photoAttachments = useMemo(
    () =>
      attachments.filter(
        (a) =>
          a.mimeType.startsWith("image/") ||
          /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(a.name),
      ),
    [attachments],
  );

  const pdfAttachments = useMemo(
    () =>
      attachments.filter(
        (a) =>
          a.mimeType === "application/pdf" ||
          /\.pdf$/i.test(a.name),
      ),
    [attachments],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="h-13 sm:h-14 w-full rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 font-semibold text-sm sm:text-base">
            <Plus className="mr-2 h-5 w-5" />
            Add Entry
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
          {/* Header */}
          <DialogHeader className="border-b border-border px-4 sm:px-5 pb-3.5 pt-4 sm:pt-5">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Add New Entry
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Capture notes, ideas, tasks and attachments in one place.
            </p>
          </DialogHeader>

          {/* Form */}
          <motion.div
            className="space-y-4 sm:space-y-5 px-4 sm:px-5 pb-5 pt-3.5"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Entry Name */}
            <motion.section variants={itemVariants} className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Entry Name
              </label>
              <Input
                placeholder="e.g. Unit 3 Database Concepts"
                value={entryName}
                onChange={(e) => setEntryName(e.target.value)}
                className="h-11 sm:h-12 rounded-xl bg-background text-sm"
              />
            </motion.section>

            {/* Subject */}
            <motion.section variants={itemVariants} className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Subject
              </label>
              <Input
                placeholder="e.g. Computer Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 sm:h-12 rounded-xl bg-background text-sm"
              />
            </motion.section>

            {/* Key Notes */}
            <motion.section variants={itemVariants} className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Key Notes
              </label>
              <Textarea
                placeholder="Summary of today's lesson, important points..."
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                className="min-h-24 sm:min-h-28 resize-none rounded-xl bg-background text-sm leading-relaxed"
              />
            </motion.section>

            {/* Tags / Categories */}
            <motion.section
              variants={itemVariants}
              className="border-t border-border/80 pt-4"
            >
              <TagSelector
                selectedTagIds={tags}
                onChange={setTags}
              />
            </motion.section>

            {/* Entry-Level Custom Reminder */}
            <motion.section
              variants={itemVariants}
              className="border-t border-border/80 pt-4"
            >
              <ReminderSection
                reminder={reminder}
                onChange={setReminder}
                title="Custom Reminder"
              />
            </motion.section>

            {/* Works / Tasks Section */}
            <motion.section
              variants={itemVariants}
              className="border-t border-border/80 pt-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                    Tasks / Assignments
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Break this entry down into actionable items.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWork}
                  className="h-8 rounded-xl border-dashed text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Task
                </Button>
              </div>

              <div className="mt-3.5 space-y-3">
                {works.map((work, index) => (
                  <motion.div
                    key={work.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-border bg-background p-3.5 sm:p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Task #{index + 1}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWork(work.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2.5 space-y-2.5">
                      <Input
                        placeholder="e.g. Read chapters 4-6, complete exercises..."
                        value={work.task}
                        onChange={(e) =>
                          updateWork(work.id, "task", e.target.value)
                        }
                        className="h-10 sm:h-11 rounded-xl bg-card text-sm"
                      />
                    </div>

                    {/* Pending List Toggle */}
                    <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-2.5 sm:p-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          Add to Pending List
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Track progress on your dashboard and pending list.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={work.addToPending}
                        onChange={(e) =>
                          updateWork(work.id, "addToPending", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>

                    {work.addToPending && (
                      <div className="mt-3 space-y-1.5">
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
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
                          className="h-10 sm:h-11 rounded-xl bg-card text-sm"
                        />
                      </div>
                    )}

                    {/* Task Reminder */}
                    <div className="mt-3 border-t border-border/60 pt-2.5">
                      <ReminderSection
                        reminder={work.reminder}
                        onChange={(rem) => updateWork(work.id, "reminder", rem)}
                        title="Task Reminder"
                        isTaskLevel
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Attachments Section */}
            <motion.section
              variants={itemVariants}
              className="border-t border-border/80 pt-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Attachments</span>
                    {attachments.length > 0 && (
                      <span className="text-xs text-primary font-semibold">
                        ({formatAttachmentSummary(attachments)})
                      </span>
                    )}
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Attach photos and PDF documents (up to 20MB).
                  </p>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg,image/gif,image/bmp"
                  multiple
                  onChange={(e) => {
                    handleFilesAdded(e.target.files);
                    if (photoInputRef.current) photoInputRef.current.value = "";
                  }}
                  className="hidden"
                  id="add-entry-photo-input"
                />

                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => {
                    handleFilesAdded(e.target.files);
                    if (pdfInputRef.current) pdfInputRef.current.value = "";
                  }}
                  className="hidden"
                  id="add-entry-pdf-input"
                />

                {/* Dual Action Buttons via Labels */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="add-entry-photo-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 sm:px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95"
                  >
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    <span>Add Photo</span>
                  </label>

                  <label
                    htmlFor="add-entry-pdf-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 sm:px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95"
                  >
                    <FileText className="h-3.5 w-3.5 text-red-400" />
                    <span>Add PDF</span>
                  </label>
                </div>
              </div>

              {/* Photos Grid */}
              {photoAttachments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Selected Photos ({photoAttachments.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                    {photoAttachments.map((att) => (
                      <AttachmentThumbnail
                        key={att.id}
                        attachment={att}
                        previewUrl={att.previewUrl}
                        isPending={true}
                        onClick={() => setPreviewPhoto(att)}
                        onDelete={() => removeAttachment(att.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* PDFs List */}
              {pdfAttachments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {photoAttachments.length > 0 && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Selected PDFs ({pdfAttachments.length})
                    </p>
                  )}
                  <div className="space-y-2">
                    {pdfAttachments.map((att) => (
                      <PdfAttachmentCard
                        key={att.id}
                        attachment={att}
                        isPending={true}
                        onClick={() => {
                          const url = att.previewUrl || (att.file instanceof Blob ? URL.createObjectURL(att.file) : undefined);
                          setPreviewPdf({
                            ...att,
                            previewUrl: url,
                          });
                        }}
                        onDelete={() => removeAttachment(att.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.section>

            {/* Additional Notes */}
            <motion.section
              variants={itemVariants}
              className="border-t border-border/80 pt-4"
            >
              <label className="mb-1.5 flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Additional Notes
              </label>

              <Textarea
                placeholder="Anything else worth remembering?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-20 sm:min-h-24 resize-none rounded-xl bg-background text-sm leading-relaxed"
              />
            </motion.section>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 border-t border-border/80 pt-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl text-xs sm:text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90"
                onClick={handleSave}
              >
                Save Entry
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Modals for previewing selected files in Add dialog */}
      <PhotoViewerModal
        open={!!previewPhoto}
        onOpenChange={(v) => !v && setPreviewPhoto(null)}
        attachment={previewPhoto}
        previewUrl={previewPhoto?.previewUrl}
      />

      <PdfViewerModal
        open={!!previewPdf}
        onOpenChange={(v) => !v && setPreviewPdf(null)}
        attachment={previewPdf}
        previewUrl={previewPdf?.previewUrl}
      />
    </>
  );
}
