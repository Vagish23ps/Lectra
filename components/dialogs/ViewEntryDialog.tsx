"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  ListTodo,
  StickyNote,
  Tag,
  Pencil,
  Paperclip,
  ImageIcon,
  Eye,
  Trash2,
  Sparkles,
  Bell,
  ArrowRight,
  Plus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Entry, Attachment } from "@/types/entry";
import { useEntryStore } from "@/store/entryStore";
import { useAllTags } from "@/store/tagStore";
import { motion } from "framer-motion";
import { listVariants, itemVariants } from "@/lib/animations";
import { formatFileSize, deleteAttachmentFile } from "@/src/lib/attachmentStorage";
import { formatReminderSummary } from "@/components/reminders/ReminderSummary";
import { formatAttachmentSummary } from "@/components/attachments/attachmentSummary";
import AttachmentThumbnail from "@/components/attachments/AttachmentThumbnail";
import PdfAttachmentCard from "@/components/attachments/PdfAttachmentCard";
import PhotoViewerModal from "@/components/attachments/PhotoViewerModal";
import PdfViewerModal from "@/components/attachments/PdfViewerModal";
import { toast } from "sonner";

interface ViewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Entry | null;
  highlightWorkId?: string | null;
  onEdit?: (entry: Entry) => void;
}

export default function ViewEntryDialog({
  open,
  onOpenChange,
  entry,
  highlightWorkId,
  onEdit,
}: ViewEntryDialogProps) {
  const updateEntry = useEntryStore((state) => state.updateEntry);
  const allTags = useAllTags();
  const tagMap = useMemo(() => new Map(allTags.map((t) => [t.id, t.name])), [allTags]);

  const [selectedPhoto, setSelectedPhoto] = useState<Attachment | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<Attachment | null>(null);
  const highlightedTaskRef = useRef<HTMLDivElement>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [inlineTaskText, setInlineTaskText] = useState("");
  const addInlineWork = useEntryStore((state) => state.addInlineWork);

  const handleAddInlineTask = () => {
    if (!entry || !inlineTaskText.trim()) return;
    addInlineWork(entry.id, inlineTaskText);
    setInlineTaskText("");
  };

  useEffect(() => {
    if (open && highlightWorkId) {
      setActiveHighlightId(highlightWorkId);
      const scrollTimer = setTimeout(() => {
        highlightedTaskRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 250);

      const fadeTimer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 3000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(fadeTimer);
      };
    } else if (!open) {
      setActiveHighlightId(null);
    }
  }, [open, highlightWorkId]);

  const toggleWorkCompleted = (workId: string) => {
    if (!entry) return;

    const updatedEntry: Entry = {
      ...entry,
      works: entry.works.map((work) =>
        work.id === workId
          ? {
              ...work,
              completed: !work.completed,
            }
          : work,
      ),
    };

    updateEntry(updatedEntry);
  };

  const handleDeleteAttachment = async (attachmentId: string, attachmentName: string) => {
    if (!entry) return;

    try {
      await deleteAttachmentFile(attachmentId);
      const updatedEntry: Entry = {
        ...entry,
        attachments: (entry.attachments || []).filter((a) => a.id !== attachmentId),
      };
      updateEntry(updatedEntry);
      toast.success(`Removed "${attachmentName}".`);
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      toast.error("Failed to delete attachment.");
    }
  };

  if (!entry) return null;

  const validWorks = entry.works.filter((work) => work.task.trim() !== "");
  const completedCount = validWorks.filter((work) => work.completed).length;
  const pendingCount = validWorks.filter(
    (work) => work.addToPending && !work.completed,
  ).length;
  const attachments = entry.attachments || [];

  const photoAttachments = attachments.filter(
    (a) =>
      a.mimeType.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(a.name),
  );

  const pdfAttachments = attachments.filter(
    (a) =>
      a.mimeType === "application/pdf" ||
      /\.pdf$/i.test(a.name),
  );

  const otherAttachments = attachments.filter(
    (a) =>
      !a.mimeType.startsWith("image/") &&
      !/\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(a.name) &&
      a.mimeType !== "application/pdf" &&
      !/\.pdf$/i.test(a.name),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="box-border flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-x-hidden overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
          {/* Header */}
          <DialogHeader className="box-border w-full min-w-0 border-b border-border px-4 pb-3.5 pt-4 pr-12 sm:px-5 sm:pt-5">
            <div className="flex w-full min-w-0 items-start justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <DialogTitle className="truncate text-base font-semibold leading-tight tracking-tight text-foreground sm:text-lg">
                    {entry.entryName || "Untitled Entry"}
                  </DialogTitle>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="truncate font-medium text-primary">
                      {entry.subject || "General"}
                    </span>
                    <span>•</span>
                    <span className="shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Entry Content */}
          <motion.div
            className="box-border w-full min-w-0 max-w-full space-y-4 px-4 pb-5 pt-3.5 sm:space-y-5 sm:px-5"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Tags (if present) */}
            {entry.tags && entry.tags.length > 0 && (
              <motion.section variants={itemVariants} className="w-full min-w-0">
                <div className="flex w-full max-w-full flex-wrap gap-1.5">
                  {entry.tags.map((tagId) => {
                    const tagName = tagMap.get(tagId) || tagId;

                    return (
                      <span
                        key={tagId}
                        className="inline-flex max-w-full min-h-[26px] items-center rounded-xl border border-border bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-xs"
                      >
                        <span className="truncate max-w-[200px]">#{tagName}</span>
                      </span>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Notes Section */}
            {(entry.lesson.trim() || entry.notes.trim()) ? (
              <motion.section
                variants={itemVariants}
                className="w-full min-w-0 space-y-3"
              >
                {entry.lesson.trim() && (
                  <div className="w-full min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Details
                      </h3>
                    </div>
                    <div className="box-border w-full min-w-0 rounded-2xl border border-border bg-background/60 p-3.5">
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90 sm:text-sm">
                        {entry.lesson}
                      </p>
                    </div>
                  </div>
                )}

                {entry.notes.trim() && (
                  <div className="w-full min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Notes
                      </h3>
                    </div>
                    <div className="box-border w-full min-w-0 rounded-2xl border border-border bg-background/60 p-3.5">
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90 sm:text-sm">
                        {entry.notes}
                      </p>
                    </div>
                  </div>
                )}
              </motion.section>
            ) : (
              <motion.section variants={itemVariants} className="w-full min-w-0">
                <div className="rounded-2xl border border-dashed border-border p-3.5 text-center text-xs italic text-muted-foreground">
                  No notes recorded for this entry.
                </div>
              </motion.section>
            )}

            {/* Tasks Section */}
            <motion.section
              variants={itemVariants}
              className="w-full min-w-0 border-t border-border/80 pt-4"
            >
              <div className="flex w-full min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">
                      Tasks
                    </h3>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {completedCount}/{validWorks.length} Done
                  </span>
                </div>
              </div>

              <div className="mt-3.5 space-y-3">
                {validWorks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-3.5 text-center text-xs text-muted-foreground">
                    No tasks recorded for this entry.
                  </div>
                ) : (
                  validWorks.map((work, index) => {
                    const isOverdue =
                      !work.completed &&
                      work.deadline &&
                      new Date(`${work.deadline}T00:00:00`).getTime() <
                        new Date().setHours(0, 0, 0, 0);

                    const isHighlighted = activeHighlightId === work.id;

                    return (
                      <div
                        key={work.id}
                        ref={isHighlighted ? highlightedTaskRef : null}
                        className={`box-border w-full min-w-0 rounded-2xl border p-3.5 transition-all duration-300 sm:p-4 ${
                          isHighlighted
                            ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/40"
                            : work.completed
                              ? "border-border bg-background/40 opacity-80"
                              : "border-border bg-background/70 shadow-xs"
                        }`}
                      >
                        <div className="flex w-full min-w-0 items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleWorkCompleted(work.id)}
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:border-primary focus:outline-none"
                            aria-label={
                              work.completed
                                ? "Mark task as incomplete"
                                : "Mark task as completed"
                            }
                          >
                            {work.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`break-words text-sm sm:text-base font-semibold leading-snug ${
                                   work.completed
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}
                              >
                                {work.task}
                              </p>

                              {isHighlighted && (
                                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                                  Target
                                </span>
                              )}
                            </div>

                            {/* Task Details Hierarchy */}
                            <div className="mt-2.5 space-y-1.5">
                              {/* Task Index & Status Badge */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  Task {index + 1}
                                </span>

                                {work.addToPending && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      work.completed
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {work.completed ? "Completed" : "Pending"}
                                  </span>
                                )}
                              </div>

                              {/* Task Custom Reminder */}
                              {work.reminder && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                  <Bell className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{formatReminderSummary(work.reminder)}</span>
                                </div>
                              )}

                              {/* Deadline */}
                              {work.deadline && (
                                <div
                                  className={`flex items-center gap-1.5 text-xs font-medium ${
                                    work.completed
                                      ? "text-muted-foreground"
                                      : isOverdue
                                        ? "text-red-400"
                                        : "text-foreground/80"
                                  }`}
                                >
                                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    Deadline:{" "}
                                    {format(
                                      new Date(`${work.deadline}T00:00:00`),
                                      "dd MMM yyyy",
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Overdue Warning Badge */}
                              {isOverdue && !work.completed && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
                                  <span>Overdue</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="mt-3 flex justify-end border-t border-border/40 pt-2.5">
                              <Button
                                size="sm"
                                variant={work.completed ? "outline" : "default"}
                                className={`h-8 rounded-xl px-3 text-xs font-medium ${
                                  work.completed
                                    ? "border-border text-muted-foreground hover:text-foreground"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                }`}
                                onClick={() => toggleWorkCompleted(work.id)}
                              >
                                {work.completed ? (
                                  <>
                                    <Circle className="mr-1.5 h-3.5 w-3.5" />
                                    Mark Incomplete
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    Mark Completed
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Task Creation */}
              <div className="mt-3 flex items-center gap-2">
                <Input
                  placeholder="Quick add a task... (Press Enter)"
                  value={inlineTaskText}
                  onChange={(e) => setInlineTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddInlineTask();
                    }
                  }}
                  className="h-10 text-xs sm:text-sm rounded-xl bg-background"
                />
                <Button
                  size="sm"
                  type="button"
                  className="h-10 rounded-xl px-3.5 text-xs font-semibold shrink-0"
                  onClick={handleAddInlineTask}
                  disabled={!inlineTaskText.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {pendingCount > 0 && (
                <p className="mt-2.5 text-xs text-amber-500 dark:text-amber-400">
                  {pendingCount} {pendingCount === 1 ? "task is" : "tasks are"}{" "}
                  still pending.
                </p>
              )}
            </motion.section>

            {/* Entry Reminder (if present) */}
            {entry.reminder && (
              <motion.section
                variants={itemVariants}
                className="w-full min-w-0 border-t border-border/80 pt-4"
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <Bell className="h-4 w-4 shrink-0 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Reminder
                  </h3>
                </div>

                <div className="box-border flex w-full min-w-0 items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-xs sm:text-sm font-semibold text-foreground">
                      {formatReminderSummary(entry.reminder)}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {entry.reminder.type === "one-time"
                        ? "One-time custom reminder"
                        : `Recurring reminder (${entry.reminder.recurrence?.frequency || "daily"})`}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Attachments Section (if present) */}
            {attachments.length > 0 && (
              <motion.section
                variants={itemVariants}
                className="w-full min-w-0 border-t border-border/80 pt-4"
              >
                <div className="mb-3 flex w-full min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="truncate font-semibold text-sm sm:text-base text-foreground">
                      Attachments
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {formatAttachmentSummary(attachments)}
                  </span>
                </div>

                {/* Photos Grid */}
                {photoAttachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Photos ({photoAttachments.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                      {photoAttachments.map((photo) => (
                        <AttachmentThumbnail
                          key={photo.id}
                          attachment={photo}
                          onClick={() => setSelectedPhoto(photo)}
                          onDelete={() => handleDeleteAttachment(photo.id, photo.name)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF Cards */}
                {pdfAttachments.length > 0 && (
                  <div className="space-y-2">
                    {photoAttachments.length > 0 && (
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        PDF Documents ({pdfAttachments.length})
                      </p>
                    )}
                    <div className="space-y-2">
                      {pdfAttachments.map((pdf) => (
                        <PdfAttachmentCard
                          key={pdf.id}
                          attachment={pdf}
                          onClick={() => setSelectedPdf(pdf)}
                          onDelete={() => handleDeleteAttachment(pdf.id, pdf.name)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Files */}
                {otherAttachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {otherAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="box-border flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-card/60 p-2.5"
                      >
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-xs font-medium text-foreground">{att.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatFileSize(att.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteAttachment(att.id, att.name)}
                          aria-label={`Remove file ${att.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* Bottom Actions */}
            {onEdit && (
              <div className="border-t border-border/80 pt-3.5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 rounded-2xl border-border bg-background py-4 text-xs sm:text-sm font-semibold text-foreground shadow-xs hover:bg-secondary"
                  onClick={() => onEdit(entry)}
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit Entry Details</span>
                </Button>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Viewer */}
      <PhotoViewerModal
        open={!!selectedPhoto}
        onOpenChange={(v) => !v && setSelectedPhoto(null)}
        attachment={selectedPhoto}
      />

      {/* PDF Viewer */}
      <PdfViewerModal
        open={!!selectedPdf}
        onOpenChange={(v) => !v && setSelectedPdf(null)}
        attachment={selectedPdf}
      />
    </>
  );
}
