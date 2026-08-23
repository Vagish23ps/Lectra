"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/types/entry";
import { getAttachmentFile, formatFileSize } from "@/src/lib/attachmentStorage";

interface PhotoViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: Attachment | null;
  previewUrl?: string;
}

export default function PhotoViewerModal({
  open,
  onOpenChange,
  attachment,
  previewUrl,
}: PhotoViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(previewUrl || null);
  const [loading, setLoading] = useState(!previewUrl);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setZoomLevel(1);
      return;
    }

    if (previewUrl) {
      setObjectUrl(previewUrl);
      setLoading(false);
      return;
    }

    let activeUrl: string | null = null;
    let isMounted = true;

    async function loadPhoto() {
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
          setError("Photo file could not be loaded from device storage.");
          setLoading(false);
          return;
        }

        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
      } catch (err) {
        console.error("Error loading photo viewer:", err);
        if (isMounted) setError("Failed to load photo.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPhoto();

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [open, attachment, previewUrl]);

  if (!open || !mounted || typeof document === "undefined") return null;
  if (!attachment && !previewUrl) return null;

  const fileName = attachment?.name || "Photo Preview";
  const fileSize = attachment ? formatFileSize(attachment.size) : "";

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-black/95 text-white backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top Safe-area Clearance & Toolbar */}
      <div className="flex w-full items-center justify-between border-b border-white/10 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        <div className="min-w-0 flex-1 pr-3">
          <h2 className="truncate text-sm font-semibold text-white">
            {fileName}
          </h2>
          {fileSize && (
            <p className="mt-0.5 text-xs text-white/60">
              {fileSize} • Image
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          {objectUrl && (
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="h-7 w-7 rounded-lg text-white hover:bg-white/20 disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="h-7 w-7 rounded-lg text-white hover:bg-white/20 disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              {zoomLevel > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="h-7 w-7 rounded-lg text-white hover:bg-white/20"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}

          {objectUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 text-xs text-white hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-slot="dialog-close"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fullscreen Photo Container */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading photo...</p>
          </div>
        ) : error ? (
          <div className="flex max-w-sm flex-col items-center gap-2 text-center text-red-400">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
          </div>
        ) : objectUrl ? (
          <div className="flex h-full w-full items-center justify-center overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={objectUrl}
              alt={fileName}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl transition-transform duration-150 select-none"
            />
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
