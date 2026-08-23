"use client";

import { FileText, ArrowRight, Trash2 } from "lucide-react";
import { Attachment } from "@/types/entry";
import { formatFileSize } from "@/src/lib/attachmentStorage";
import { Button } from "@/components/ui/button";

interface PdfAttachmentCardProps {
  attachment: Attachment;
  onClick?: () => void;
  onDelete?: () => void;
  isPending?: boolean;
}

export default function PdfAttachmentCard({
  attachment,
  onClick,
  onDelete,
  isPending = false,
}: PdfAttachmentCardProps) {
  return (
    <div className="group relative flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-3 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Icon & Details */}
      <div
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 overflow-hidden"
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Open PDF ${attachment.name}`}
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-colors group-hover:bg-red-500/15">
          <FileText className="h-6 w-6" />
          <span className="absolute -bottom-1 -right-1 rounded-md bg-red-500 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
            PDF
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
              {attachment.name}
            </p>
            {isPending && (
              <span className="shrink-0 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                New
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {formatFileSize(attachment.size)} • PDF Document
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center gap-1.5">
        {onClick && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-xl px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
            onClick={onClick}
          >
            <span>View</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${attachment.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
