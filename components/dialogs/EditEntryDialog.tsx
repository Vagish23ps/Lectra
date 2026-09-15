"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  FileText,
  ListTodo,
  Plus,
  StickyNote,
  Tag,
  Trash2,
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
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Entry, WorkItem, Attachment } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";
import { motion, AnimatePresence } from "framer-motion";
import { listVariants, itemVariants } from "@/lib/animations";
import { saveAttachmentFile, deleteAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";
import TagSelector from "@/components/tags/TagSelector";
import ReminderSection from "@/components/reminders/ReminderSection";
import { CustomReminder } from "@/types/reminder";
import AttachmentThumbnail from "@/components/attachments/AttachmentThumbnail";
import PdfAttachmentCard from "@/components/attachments/PdfAttachmentCard";
import PhotoViewerModal from "@/components/attachments/PhotoViewerModal";
import PdfViewerModal from "@/components/attachments/PdfViewerModal";
import { formatAttachmentSummary } from "@/components/attachments/attachmentSummary";

interface EditEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Entry;
}

interface PendingNewAttachment {
  id: string;
  file: File | Blob;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  previewUrl?: string;
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
  const [tags, setTags] = useState<string[]>([]);
  const [reminder, setReminder] = useState<CustomReminder | undefined>(undefined);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<PendingNewAttachment[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const detailsInputRef = useRef<HTMLTextAreaElement>(null);

  const [previewPhoto, setPreviewPhoto] = useState<{
    attachment: Attachment;
    previewUrl?: string;
  } | null>(null);

  const [previewPdf, setPreviewPdf] = useState<{
    attachment: Attachment;
    previewUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setEntryName(entry.entryName);
      setSubject(entry.subject);
      setLesson(entry.lesson);
      setNotes(entry.notes);
      setTags(entry.tags ? [...entry.tags] : []);
      setReminder(entry.reminder ? { ...entry.reminder } : undefined);
      setWorks(entry.works.map((work) => ({ ...work })));
      setExistingAttachments(entry.attachments ? [...entry.attachments] : []);
      setNewAttachments([]);
      setDeletedAttachmentIds([]);
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

    const newItems: PendingNewAttachment[] = [];

    Array.from(files).forEach((file) => {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const isImg =
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(file.name);

      if (!isPdf && !isImg && !allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" has unsupported format. Only Photos and PDFs are supported.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 20MB.`);
        return;
      }

      const id = crypto.randomUUID();
      const previewUrl = isImg ? URL.createObjectURL(file) : undefined;

      newItems.push({
        id,
        file,
        name: file.name,
        mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        size: file.size,
        createdAt: new Date().toISOString(),
        previewUrl,
      });
    });

    if (newItems.length > 0) {
      setNewAttachments((prev) => [...prev, ...newItems]);
      toast.success(
        `Added ${newItems.length} file${newItems.length > 1 ? "s" : ""}.`
      );
    }
  };

  const removeExistingAttachment = (id: string) => {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
    setDeletedAttachmentIds((prev) => [...prev, id]);
  };

  const removeNewAttachment = (id: string) => {
    setNewAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const cleanupNewUrls = () => {
    newAttachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
  };

  const handleClose = () => {
    cleanupNewUrls();
    onOpenChange(false);
  };

  const handleSave = async () => {
    try {
      // Save newly added files to IndexedDB
      for (const item of newAttachments) {
        await saveAttachmentFile(item.id, item.file);
      }

      // Delete removed files from IndexedDB
      for (const id of deletedAttachmentIds) {
        await deleteAttachmentFile(id);
      }

      const newMetadata: Attachment[] = newAttachments.map((a) => ({
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt,
      }));

      const finalAttachments = [...existingAttachments, ...newMetadata];

      // Merge notes into lesson if notes has content (P0-6 migration)
      const mergedLesson = notes.trim()
        ? lesson.trim()
          ? `${lesson.trim()}\n\n${notes.trim()}`
          : notes.trim()
        : lesson.trim();

      const updatedEntry: Entry = {
        ...entry,
        entryName: entryName.trim(),
        subject: subject.trim(),
        lesson: mergedLesson,
        notes: "",
        works,
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
        tags: tags.length > 0 ? tags : undefined,
        reminder,
      };

      updateEntry(updatedEntry);
      toast.success("Entry saved");

      cleanupNewUrls();
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating entry attachments:", err);
      toast.error("Failed to update entry attachments.");
    }
  };

  // Group existing attachments
  const existingPhotos = useMemo(
    () =>
      existingAttachments.filter(
        (a) =>
          a.mimeType.startsWith("image/") ||
          /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(a.name),
      ),
    [existingAttachments],
  );

  const existingPdfs = useMemo(
    () =>
      existingAttachments.filter(
        (a) =>
          a.mimeType === "application/pdf" ||
          /\.pdf$/i.test(a.name),
      ),
    [existingAttachments],
  );

  // Group new attachments
  const newPhotos = useMemo(
    () =>
      newAttachments.filter(
        (a) =>
          a.mimeType.startsWith("image/") ||
          /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(a.name),
      ),
    [newAttachments],
  );

  const newPdfs = useMemo(
    () =>
      newAttachments.filter(
        (a) =>
          a.mimeType === "application/pdf" ||
          /\.pdf$/i.test(a.name),
      ),
    [newAttachments],
  );

  const totalAttachmentsCount = existingAttachments.length + newAttachments.length;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}>
        <DialogContent className="box-border flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden border-border bg-popover p-0 sm:max-w-lg">
          {/* Header */}
          <DialogHeader className="box-border shrink-0 w-full min-w-0 border-b border-border px-4 pb-3.5 pt-4 pr-12 sm:px-5 sm:pt-5">
            <DialogTitle className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Edit Entry
            </DialogTitle>
          </DialogHeader>

          {/* Form Scroll Body */}
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
                        placeholder="Add task"
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
                          {[
                            { label: "Today", value: format(new Date(), "yyyy-MM-dd") },
                            { label: "Tomorrow", value: format(new Date(Date.now() + 86400000), "yyyy-MM-dd") },
                            {
                              label: "Next Week",
                              value: (() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 7);
                                return format(d, "yyyy-MM-dd");
                              })(),
                            },
                          ].map((preset) => {
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
                    {totalAttachmentsCount > 0 && (
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        ({totalAttachmentsCount} total)
                      </span>
                    )}
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Manage attached photos and PDF documents.
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
                  id="edit-entry-photo-input"
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
                  id="edit-entry-pdf-input"
                />

                {/* Dual Action Buttons via Labels */}
                <div className="flex shrink-0 items-center gap-2">
                  <label
                    htmlFor="edit-entry-photo-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95 sm:px-3"
                  >
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    <span>Add Photo</span>
                  </label>

                  <label
                    htmlFor="edit-entry-pdf-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95 sm:px-3"
                  >
                    <FileText className="h-3.5 w-3.5 text-red-400" />
                    <span>Add PDF</span>
                  </label>
                </div>
              </div>

              {/* Existing / Saved Attachments */}
              {existingAttachments.length > 0 && (
                <div className="mt-3 space-y-2.5 rounded-2xl border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Saved Attachments ({existingAttachments.length})
                    </span>
                  </div>

                  {/* Saved Photos */}
                  {existingPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                      {existingPhotos.map((att) => (
                        <AttachmentThumbnail
                          key={att.id}
                          attachment={att}
                          onClick={() => setPreviewPhoto({ attachment: att })}
                          onDelete={() => removeExistingAttachment(att.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Saved PDFs */}
                  {existingPdfs.length > 0 && (
                    <div className="space-y-2">
                      {existingPdfs.map((att) => (
                        <PdfAttachmentCard
                          key={att.id}
                          attachment={att}
                          onClick={() => setPreviewPdf({ attachment: att })}
                          onDelete={() => removeExistingAttachment(att.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Newly Added Attachments (Pending Save) */}
              {newAttachments.length > 0 && (
                <div className="mt-3 space-y-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                      New Attachments ({newAttachments.length} Pending)
                    </span>
                  </div>

                  {/* New Photos */}
                  {newPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                      {newPhotos.map((att) => (
                        <AttachmentThumbnail
                          key={att.id}
                          attachment={att}
                          previewUrl={att.previewUrl}
                          isPending={true}
                          onClick={() =>
                            setPreviewPhoto({
                              attachment: att,
                              previewUrl: att.previewUrl,
                            })
                          }
                          onDelete={() => removeNewAttachment(att.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* New PDFs */}
                  {newPdfs.length > 0 && (
                    <div className="space-y-2">
                      {newPdfs.map((att) => (
                        <PdfAttachmentCard
                          key={att.id}
                          attachment={att}
                          isPending={true}
                          onClick={() => {
                            const url =
                              att.previewUrl ||
                              (att.file instanceof Blob
                                ? URL.createObjectURL(att.file)
                                : undefined);
                            setPreviewPdf({
                              attachment: att,
                              previewUrl: url,
                            });
                          }}
                          onDelete={() => removeNewAttachment(att.id)}
                        />
                      ))}
                    </div>
                  )}
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
              className="h-10 rounded-xl px-4 text-xs font-medium sm:h-11 sm:text-sm"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] sm:h-11 sm:text-sm"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals for previewing photos / PDFs in Edit dialog */}
      <PhotoViewerModal
        open={!!previewPhoto}
        onOpenChange={(v) => !v && setPreviewPhoto(null)}
        attachment={previewPhoto?.attachment || null}
        previewUrl={previewPhoto?.previewUrl}
      />

      <PdfViewerModal
        open={!!previewPdf}
        onOpenChange={(v) => !v && setPreviewPdf(null)}
        attachment={previewPdf?.attachment || null}
        previewUrl={previewPdf?.previewUrl}
      />
    </>
  );
}
