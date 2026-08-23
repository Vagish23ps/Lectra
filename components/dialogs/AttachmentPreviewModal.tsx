"use client";

import { useEffect, useState } from "react";
import { X, Download, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/types/entry";
import { getAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";

interface AttachmentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: Attachment | null;
}

export default function AttachmentPreviewModal({
  open,
  onOpenChange,
  attachment,
}: AttachmentPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeUrl: string | null = null;

    async function loadFile() {
      if (!open || !attachment) {
        setObjectUrl(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const blob = await getAttachmentFile(attachment.id);
        if (!blob) {
          setError("Attachment file could not be loaded from local storage.");
          setLoading(false);
          return;
        }

        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
      } catch (err) {
        console.error("Error loading attachment:", err);
        setError("Failed to load attachment.");
      } finally {
        setLoading(false);
      }
    }

    void loadFile();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [open, attachment]);

  if (!attachment) return null;

  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf" || attachment.name.endsWith(".pdf");

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden border-border bg-popover p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1 pr-4">
            <DialogTitle className="truncate text-base font-semibold">
              {attachment.name}
            </DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatFileSize(attachment.size)} • {attachment.mimeType || "File"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {objectUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 gap-1.5 rounded-xl text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex max-h-[75vh] min-h-[250px] items-center justify-center overflow-auto bg-black/20 p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading preview...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-400">
              {error}
            </div>
          ) : isImage && objectUrl ? (
            <img
              src={objectUrl}
              alt={attachment.name}
              className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-md"
            />
          ) : isPdf && objectUrl ? (
            <div className="flex h-[68vh] w-full flex-col items-center">
              <iframe
                src={objectUrl}
                title={attachment.name}
                className="h-full w-full rounded-xl border border-border bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{attachment.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview not available for this format.
                </p>
              </div>
              {objectUrl && (
                <Button size="sm" onClick={handleDownload} className="mt-2 rounded-xl">
                  Download File
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
