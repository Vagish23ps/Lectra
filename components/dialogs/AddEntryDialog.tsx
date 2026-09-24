"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
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
import { useDraftStore, DraftEntry, isDraftEmpty } from "@/store/draftStore";
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

interface AddEntryDialogProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  defaultEntryDate?: string; // "YYYY-MM-DD"
}

export default function AddEntryDialog({
  externalOpen,
  onExternalOpenChange,
  defaultEntryDate,
}: AddEntryDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isExternallyControlled = externalOpen !== undefined;
  const open = isExternallyControlled ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isExternallyControlled) {
      onExternalOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const addEntry = useEntryStore((state) => state.addEntry);
  const { draft, saveDraft, clearDraft, hasDraft } = useDraftStore();
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const detailsInputRef = useRef<HTMLTextAreaElement>(null);

  const [previewPhoto, setPreviewPhoto] = useState<PendingAttachment | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PendingAttachment | null>(null);

  const datePresets = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return [
      { label: "Today", value: format(today, "yyyy-MM-dd") },
      { label: "Tomorrow", value: format(tomorrow, "yyyy-MM-dd") },
      { label: "Next Week", value: format(nextWeek, "yyyy-MM-dd") },
    ];
  }, []);

  useEffect(() => {
    if (open) {
      const currentDraft = useDraftStore.getState().draft;
      if (currentDraft && !isDraftEmpty(currentDraft)) {
        setEntryName((prev) => (prev ? prev : currentDraft.entryName || ""));
        setSubject((prev) => (prev ? prev : currentDraft.subject || ""));
        setLesson((prev) => (prev ? prev : currentDraft.lesson || ""));
        setNotes((prev) => (prev ? prev : currentDraft.notes || ""));
        setTags((prev) => (prev.length > 0 ? prev : currentDraft.tags || []));
        setWorks((prev) => (prev.length > 0 ? prev : currentDraft.works || []));
        setReminder((prev) => (prev ? prev : currentDraft.reminder));
      }
    }
  }, [open]);

  const debouncedSaveDraft = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDraft({
        entryName,
        subject,
        lesson,
        notes,
        tags,
        works,
        entryDate: defaultEntryDate,
        reminder,
      });
    }, 500);
  }, [entryName, subject, lesson, notes, tags, works, defaultEntryDate, reminder, saveDraft]);

  useEffect(() => {
    if (open) {
      debouncedSaveDraft();
    }
  }, [entryName, subject, lesson, notes, tags, works, reminder, open, debouncedSaveDraft]);

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
      "image/heic",
      "image/heif",
    ];

    const newItems: PendingAttachment[] = [];

    Array.from(files).forEach((file) => {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const isImg =
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(file.name);

      if (!isPdf && !isImg && !allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" is unsupported. Only Photos and PDFs are supported.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 20MB limit.`);
        return;
      }

      const id = crypto.randomUUID();
      const previewUrl = isImg ? URL.createObjectURL(file) : undefined;

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
      toast.success(
        `Added ${newItems.length} file${newItems.length > 1 ? "s" : ""}.`
      );
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
        entryDate: (defaultEntryDate && defaultEntryDate <= format(new Date(), "yyyy-MM-dd")) ? defaultEntryDate : undefined,
        works,
        attachments: attachmentMetadata.length > 0 ? attachmentMetadata : undefined,
        tags: tags.length > 0 ? tags : undefined,
        reminder,
      };

      addEntry(entry);
      clearDraft();
      toast.success("Entry saved");

      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Error saving entry attachments:", err);
      toast.error("Failed to save entry attachments.");
    }
  };

  const recentCategories = useMemo(() => {
    const entries = useEntryStore.getState().entries;
    const counts = new Map<string, number>();
    for (const e of entries) {
      const cat = e.subject?.trim();
      if (cat) counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [open]);

  const photoAttachments = useMemo(
    () =>
      attachments.filter(
        (a) =>
          a.mimeType.startsWith("image/") ||
          /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(a.name),
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
        {!isExternallyControlled && (
          <DialogTrigger asChild>
            <Button className="h-13 sm:h-14 w-full rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 font-semibold text-sm sm:text-base">
              <Plus className="mr-2 h-5 w-5" />
              Add Entry
            </Button>
          </DialogTrigger>
        )}

        <DialogContent className="box-border flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden border-border bg-popover p-0 sm:max-w-lg">
          {/* Header */}
          <DialogHeader className="box-border w-full shrink-0 min-w-0 border-b border-border px-4 pb-3.5 pt-4 pr-12 sm:px-5 sm:pt-5">
            <DialogTitle className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Add New Entry
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
            <motion.div
              className="box-border w-full min-w-0 max-w-full space-y-4 sm:space-y-5"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Title */}
              <motion.section variants={itemVariants} className="w-full min-w-0 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Title</span>
                </label>
                <Input
                  placeholder="Enter title"
                  value={entryName}
                  onChange={(e) => setEntryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      categoryInputRef.current?.focus();
                    }
                  }}
                  className="h-11 w-full min-w-0 rounded-xl bg-background text-sm sm:h-12"
                  autoFocus
                />
              </motion.section>

              {/* Category */}
              <motion.section variants={itemVariants} className="w-full min-w-0 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                  <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Category</span>
                </label>
                <Input
                  ref={categoryInputRef}
                  placeholder="Enter category"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      detailsInputRef.current?.focus();
                    }
                  }}
                  className="h-11 w-full min-w-0 rounded-xl bg-background text-sm sm:h-12"
                />
                {recentCategories.length > 0 && !subject && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recentCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSubject(cat)}
                        className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* Details */}
              <motion.section variants={itemVariants} className="w-full min-w-0 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                  <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Details</span>
                </label>
                <Textarea
                  ref={detailsInputRef}
                  placeholder="Add details"
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="min-h-24 w-full min-w-0 resize-none rounded-xl bg-background text-sm leading-relaxed sm:min-h-28"
                />
              </motion.section>

            {/* Tags */}
            <motion.section
              variants={itemVariants}
              className="w-full min-w-0 border-t border-border/80 pt-4"
            >
              <TagSelector
                selectedTagIds={tags}
                onChange={setTags}
              />
            </motion.section>

            {/* Reminder */}
            <motion.section
              variants={itemVariants}
              className="w-full min-w-0 border-t border-border/80 pt-4"
            >
              <ReminderSection
                reminder={reminder}
                onChange={setReminder}
                title="Reminder"
              />
            </motion.section>

            {/* Tasks Section */}
            <motion.section
              variants={itemVariants}
              className="w-full min-w-0 border-t border-border/80 pt-4"
            >
              <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                    <ListTodo className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">Tasks</span>
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWork}
                  className="h-8 shrink-0 rounded-xl border-dashed px-2.5 text-xs"
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
                    className="box-border w-full min-w-0 rounded-2xl border border-border bg-background p-3.5 shadow-xs sm:p-4"
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Task #{index + 1}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWork(work.id)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove task ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2.5 space-y-2.5">
                      <Input
                        placeholder="Add task (Press Enter for next task)"
                        value={work.task}
                        onChange={(e) =>
                          updateWork(work.id, "task", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addWork();
                          }
                        }}
                        className="h-10 w-full min-w-0 rounded-xl bg-card text-sm sm:h-11"
                      />
                    </div>

                    {/* Pending List Toggle */}
                    <label className="mt-3 flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 sm:p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground sm:text-sm">
                          Add to Pending List
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={work.addToPending}
                        onChange={(e) =>
                          updateWork(work.id, "addToPending", e.target.checked)
                        }
                        className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>

                    {work.addToPending && (
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Deadline</span>
                          <span className="font-normal text-muted-foreground">
                            (Optional)
                          </span>
                        </label>

                        {/* Quick Deadline Presets */}
                        <div className="flex flex-wrap gap-1.5">
                          {datePresets.map((preset) => {
                            const isSelected = work.deadline === preset.value;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => updateWork(work.id, "deadline", preset.value)}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all active:scale-95 ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary font-semibold"
                                    : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                          {work.deadline && (
                            <button
                              type="button"
                              onClick={() => updateWork(work.id, "deadline", "")}
                              className="rounded-lg border border-border/80 bg-secondary/30 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-destructive active:scale-95"
                            >
                              No Deadline
                            </button>
                          )}
                        </div>

                        <Input
                          type="date"
                          value={work.deadline}
                          onChange={(e) =>
                            updateWork(work.id, "deadline", e.target.value)
                          }
                          className="h-10 w-full min-w-0 rounded-xl bg-card text-sm sm:h-11"
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
              className="w-full min-w-0 border-t border-border/80 pt-4"
            >
              <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">Attachments</span>
                    {attachments.length > 0 && (
                      <span className="shrink-0 text-xs font-semibold text-primary">
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
                  accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.heic,.heif"
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
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={(e) => {
                    handleFilesAdded(e.target.files);
                    if (pdfInputRef.current) pdfInputRef.current.value = "";
                  }}
                  className="hidden"
                  id="add-entry-pdf-input"
                />

                {/* Dual Action Buttons via Labels */}
                <div className="flex shrink-0 items-center gap-2">
                  <label
                    htmlFor="add-entry-photo-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95 sm:px-3"
                  >
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    <span>Add Photo</span>
                  </label>

                  <label
                    htmlFor="add-entry-pdf-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95 sm:px-3"
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
            </motion.div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="sticky bottom-0 z-20 flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-popover/95 px-4 py-3 backdrop-blur-sm sm:px-5">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-4 text-xs sm:text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="h-10 rounded-xl bg-primary px-5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]"
              onClick={handleSave}
            >
              Save Entry
            </Button>
          </div>
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
