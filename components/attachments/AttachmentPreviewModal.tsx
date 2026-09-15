"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { getAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";

interface AttachmentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: {
    id: string;
    name: string;
    type: string;
    formattedSize: string;
    isReferenced: boolean;
    linkedEntry?: { id: string; title: string } | null;
  } | null;
  onDelete: () => void;
}

export default function AttachmentPreviewModal({
  open,
  onOpenChange,
  attachment,
  onDelete,
}: AttachmentPreviewModalProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = attachment?.type?.startsWith("image/") || false;
  const isPdf = attachment?.type?.includes("pdf") || attachment?.name?.endsWith(".pdf") || false;

  useEffect(() => {
    if (open && attachment && isImage) {
      // Load thumbnail from IndexedDB
      getAttachmentFile(attachment.id).then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      }).catch(() => {});
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [open, attachment?.id]);

  if (!attachment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="box-border flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-4 pb-3 pt-4 pr-12 sm:px-5">
          <DialogTitle className="truncate text-base font-semibold text-foreground">
            {attachment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {/* Preview */}
          {isImage && previewUrl ? (
            <div className="flex justify-center rounded-2xl bg-secondary/30 p-2">
              <img
                src={previewUrl}
                alt={attachment.name}
                className="max-h-64 rounded-xl object-contain"
              />
            </div>
          ) : isPdf ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-red-500/5 py-8">
              <FileText className="h-12 w-12 text-red-500" />
              <p className="mt-2 text-xs font-semibold text-foreground">PDF Document</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-8">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-xs font-semibold text-foreground">File</p>
            </div>
          )}

          {/* Details */}
          <div className="mt-4 space-y-2 rounded-2xl border border-border bg-background/50 p-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium text-foreground">{attachment.formattedSize}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">{isPdf ? "PDF" : isImage ? "Image" : "File"}</span>
            </div>
            {attachment.isReferenced && attachment.linkedEntry ? (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Linked to</span>
                <span className="font-medium text-foreground truncate max-w-[180px]">
                  {attachment.linkedEntry.title}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-amber-500">Unreferenced</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
          {attachment.isReferenced && attachment.linkedEntry && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 rounded-xl text-xs font-medium gap-1.5"
              onClick={() => {
                onOpenChange(false);
                router.push(`/?viewEntry=${attachment.linkedEntry!.id}`);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Entry
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1.5"
            onClick={() => {
              onOpenChange(false);
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
