"use client";

import { useDraftStore, isDraftEmpty } from "@/store/draftStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileEdit, Trash2, ChevronRight, ListTodo, Bell, Tag } from "lucide-react";
import { toast } from "sonner";

interface DraftCardProps {
  onOpenDraft: () => void;
}

export default function DraftCard({ onOpenDraft }: DraftCardProps) {
  const { draft, clearDraft } = useDraftStore();

  if (!draft || isDraftEmpty(draft)) return null;

  const title = draft.entryName?.trim() || draft.subject?.trim() || "Untitled Draft";
  const category = draft.subject?.trim();
  const validTasks = (draft.works || []).filter((w) => w.task.trim());
  const hasReminder = Boolean(draft.reminder);

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearDraft();
    toast.info("Draft discarded");
  };

  return (
    <Card
      onClick={onOpenDraft}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-amber-500/40 bg-card shadow-xs transition-all duration-200 hover:border-amber-500/70 hover:shadow-md active:scale-[0.99] dark:border-amber-500/30"
    >
      {/* Draft accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />

      <CardContent className="p-4 sm:p-5 pl-5 sm:pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                <FileEdit className="h-3 w-3" />
                Draft
              </span>

              {category && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {category}
                </span>
              )}

              {hasReminder && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Bell className="h-3 w-3" />
                  Reminder
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className="mt-2 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
              {title}
            </h4>

            {/* Preview of Notes or Lesson */}
            {draft.lesson && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                Lesson: {draft.lesson}
              </p>
            )}

            {draft.notes && !draft.lesson && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {draft.notes}
              </p>
            )}

            {/* Tasks preview */}
            {validTasks.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListTodo className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  {validTasks.length} task{validTasks.length > 1 ? "s" : ""} in draft
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95"
              onClick={handleDiscard}
              aria-label="Discard draft"
              title="Discard draft"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="flex h-8 w-8 items-center justify-center text-muted-foreground group-hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
          <span>Tap to continue editing</span>
          <span className="font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>
        </div>
      </CardContent>
    </Card>
  );
}