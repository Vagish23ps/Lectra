"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    ];

    const newItems: PendingNewAttachment[] = [];

    Array.from(files).forEach((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);

      if (!isPdf && !isImg && !allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" has unsupported format. Only Photos and PDFs are supported.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 20MB.`);
        return;
      }

      const id = crypto.randomUUID();
      const previewUrl = (isImg || file.type.startsWith("image/"))
        ? URL.createObjectURL(file)
        : undefined;

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

      const updatedEntry: Entry = {
        ...entry,
        entryName: entryName.trim(),
        subject: subject.trim(),
        lesson: lesson.trim(),
        notes: notes.trim(),
        works,
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
        tags: tags.length > 0 ? tags : undefined,
        reminder,
      };

      updateEntry(updatedEntry);
      toast.success("Entry updated successfully.");

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
          /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(a.name),
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
          /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(a.name),
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
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
          {/* Header */}
          <DialogHeader className="border-b border-border px-4 sm:px-5 pb-3.5 pt-4 sm:pt-5">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Edit Entry
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Update notes, tasks and attached materials.
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
                    Update or add tasks for this entry.
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
                    {totalAttachmentsCount > 0 && (
                      <span className="text-xs text-primary font-semibold">
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
                  accept="image/png,image/jpeg,image/webp,image/jpg,image/gif,image/bmp"
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
                  accept="application/pdf"
                  multiple
                  onChange={(e) => {
                    handleFilesAdded(e.target.files);
                    if (pdfInputRef.current) pdfInputRef.current.value = "";
                  }}
                  className="hidden"
                  id="edit-entry-pdf-input"
                />

                {/* Dual Action Buttons via Labels */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="edit-entry-photo-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 sm:px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95"
                  >
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    <span>Add Photo</span>
                  </label>

                  <label
                    htmlFor="edit-entry-pdf-input"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2.5 sm:px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-95"
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
                onClick={handleClose}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
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
