"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Attachment } from "@/types/entry";
import { getAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";
import { Button } from "@/components/ui/button";

interface AttachmentThumbnailProps {
  attachment: Attachment;
  previewUrl?: string;
  onClick?: () => void;
  onDelete?: () => void;
  isPending?: boolean;
}

export default function AttachmentThumbnail({
  attachment,
  previewUrl,
  onClick,
  onDelete,
  isPending = false,
}: AttachmentThumbnailProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!previewUrl);
  const [error, setError] = useState(false);

  const displayUrl = previewUrl || blobUrl;
  const isLoading = previewUrl ? false : loading;

  useEffect(() => {
    if (previewUrl) {
      return;
    }

    let isMounted = true;
    let localUrl: string | null = null;

    async function loadThumbnail() {
      try {
        setLoading(true);
        setError(false);
        const blob = await getAttachmentFile(attachment.id);
        if (!isMounted) return;

        if (blob) {
          localUrl = URL.createObjectURL(blob);
          setBlobUrl(localUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading thumbnail:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadThumbnail();

    return () => {
      isMounted = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [attachment.id, previewUrl]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Thumbnail Container */}
      <div
        className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden bg-muted/40 sm:h-36"
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`View photo ${attachment.name}`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[11px]">Loading...</span>
          </div>
        ) : error || !displayUrl ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground p-2 text-center">
            <ImageIcon className="h-6 w-6 opacity-40 text-amber-500" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Attachment unavailable</span>
          </div>
        ) : (
          <Image
            src={displayUrl}
            alt={attachment.name}
            fill
            unoptimized
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}

        {/* View Indicator Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-md">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>View</span>
          </div>
        </div>

        {/* Pending Tag if new */}
        {isPending && (
          <div className="absolute left-2 top-2 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-xs">
            New
          </div>
        )}
      </div>

      {/* Info Row */}
      <div className="box-border flex w-full min-w-0 items-center justify-between gap-2 p-2.5">
        <div
          className="min-w-0 flex-1 overflow-hidden cursor-pointer"
          onClick={onClick}
        >
          <p className="truncate text-xs font-medium text-foreground group-hover:text-primary">
            {attachment.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {formatFileSize(attachment.size)}
          </p>
        </div>

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
