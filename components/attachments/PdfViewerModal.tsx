"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/types/entry";
import { getAttachmentFile, exportAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";
import { toast } from "sonner";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: Attachment | null;
  previewUrl?: string;
}

export default function PdfViewerModal({
  open,
  onOpenChange,
  attachment,
  previewUrl,
}: PdfViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(previewUrl || null);
  const [loading, setLoading] = useState(!previewUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    if (previewUrl) {
      setObjectUrl(previewUrl);
      setLoading(false);
      return;
    }

    let activeUrl: string | null = null;
    let isMounted = true;

    async function loadPdf() {
      if (!attachment) {
        setObjectUrl(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const blob = await getAttachmentFile(attachment.id);
        if (!isMounted) return;

        if (!blob) {
          setError("PDF document could not be loaded from device storage.");
          setLoading(false);
          return;
        }

        // Ensure proper MIME type on the blob
        const pdfBlob =
          blob.type === "application/pdf"
            ? blob
            : new Blob([blob], { type: "application/pdf" });

        activeUrl = URL.createObjectURL(pdfBlob);
        setObjectUrl(activeUrl);
      } catch (err) {
        console.error("Error loading PDF viewer:", err);
        if (isMounted) setError("Failed to load PDF document.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPdf();

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [open, attachment, previewUrl]);

  if (!open || !mounted || typeof document === "undefined") return null;
  if (!attachment && !previewUrl) return null;

  const fileName = attachment?.name || "PDF Document";
  const fileSize = attachment ? formatFileSize(attachment.size) : "";

  const handleDownload = async () => {
    try {
      let blob: Blob | null = null;
      if (attachment?.id) {
        blob = await getAttachmentFile(attachment.id);
      }
      if (!blob && objectUrl) {
        const res = await fetch(objectUrl);
        blob = await res.blob();
      }
      if (!blob) {
        toast.error("Could not retrieve PDF data to save.");
        return;
      }
      const res = await exportAttachmentFile(blob, fileName, "application/pdf");
      if (res.method === "share") {
        // Shared via native Android sheet
      } else {
        toast.success("PDF saved.");
      }
    } catch (err) {
      console.error("Save PDF error:", err);
      toast.error("Failed to save PDF document.");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-background/95 text-foreground backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top Safe-Area Clearance & Toolbar */}
      <div className="flex w-full items-center justify-between border-b border-border bg-card/80 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] shadow-xs">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {fileName}
            </h2>
            {fileSize && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fileSize} • PDF Document
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {objectUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5 rounded-xl border-border bg-background px-3 text-xs text-foreground shadow-xs hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-slot="dialog-close"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-muted/20 p-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading PDF document...</p>
          </div>
        ) : error ? (
          <div className="flex max-w-sm flex-col items-center gap-3 p-6 text-center text-red-400">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">{error}</p>
            {objectUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="rounded-xl border-border text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download File
              </Button>
            )}
          </div>
        ) : objectUrl ? (
          <div className="flex h-full w-full flex-col items-center gap-2">
            <iframe
              src={`${objectUrl}#view=FitH`}
              title={fileName}
              className="h-full w-full flex-1 rounded-2xl border border-border bg-white shadow-md"
            />

            {/* Mobile Fallback Helper */}
            <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 text-xs shadow-xs">
              <span className="text-muted-foreground">
                PDF document loaded ({fileSize})
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="h-7 gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <Download className="h-3 w-3" />
                <span>Download / Open</span>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
