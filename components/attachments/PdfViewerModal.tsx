"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/types/entry";
import {
  getAttachmentFile,
  exportAttachmentFile,
  formatFileSize,
} from "@/src/lib/attachmentStorage";
import { toast } from "sonner";

interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PdfPage {
  getViewport: (params: { scale: number }) => {
    width: number;
    height: number;
  };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: object;
  }) => PdfRenderTask;
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: Attachment | null;
  previewUrl?: string;
}

const emptySubscribe = () => () => {};

export default function PdfViewerModal({
  open,
  onOpenChange,
  attachment,
  previewUrl,
}: PdfViewerModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);

  // Load PDF Document when Modal Opens
  useEffect(() => {
    if (!open) return;

    let isCancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setPdfDoc(null);
      setCurrentPage(1);
      setNumPages(0);
      setActiveBlob(null);

      try {
        let blob: Blob | null =
          attachment && "file" in attachment && attachment.file instanceof Blob
            ? (attachment.file as Blob)
            : null;
        if (!blob && attachment?.id) {
          blob = await getAttachmentFile(attachment.id);
        }
        if (!blob && previewUrl) {
          const res = await fetch(previewUrl);
          blob = await res.blob();
        }

        if (isCancelled) return;

        if (!blob || blob.size === 0) {
          setError("Attachment unavailable");
          setLoading(false);
          return;
        }

        setActiveBlob(blob);

        const arrayBuffer = await blob.arrayBuffer();
        if (isCancelled) return;

        // Dynamically import pdfjs
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
        if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error("PDF.js loading error:", err);
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to parse and load PDF document."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [open, attachment, previewUrl]);

  // Render Page to Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > numPages) {
      return;
    }

    // Cancel in-flight render task if any
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
    }

    setRendering(true);

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale: zoomScale });
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.scale(outputScale, outputScale);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      ctx.restore();
    } catch (err) {
      const isCancelledError =
        err instanceof Error && err.name === "RenderingCancelledException";
      if (!isCancelledError) {
        console.error("Canvas PDF render error:", err);
      }
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, currentPage, numPages, zoomScale]);

  useEffect(() => {
    if (pdfDoc && !loading) {
      void renderCurrentPage();
    }
  }, [pdfDoc, loading, currentPage, zoomScale, renderCurrentPage]);

  const handleClose = () => {
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignored
      }
    }
    setPdfDoc(null);
    setCurrentPage(1);
    setNumPages(0);
    setActiveBlob(null);
    setError(null);
    onOpenChange(false);
  };

  if (!open || !mounted || typeof document === "undefined") return null;
  if (!attachment && !previewUrl) return null;

  const fileName = attachment?.name || "PDF Document";
  const fileSize = attachment ? formatFileSize(attachment.size) : "";

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 0.6));
  };

  const handleResetZoom = () => {
    setZoomScale(1.2);
  };

  const handleSave = async () => {
    try {
      let blob = activeBlob;
      if (!blob && attachment?.id) {
        blob = await getAttachmentFile(attachment.id);
      }
      if (!blob) {
        toast.error("Could not retrieve PDF data to save.");
        return;
      }

      const res = await exportAttachmentFile(blob, fileName, "application/pdf");
      toast.success(`File saved\n${fileName}\nLocation: ${res.destination}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Storage error";
      if (message !== "Save cancelled by user.") {
        toast.error(`Could not save file\n${message}`);
      }
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-background text-foreground backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top Toolbar */}
      <div className="flex w-full flex-wrap items-center justify-between border-b border-border bg-card/90 px-3 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+0.6rem)] shadow-xs sm:px-4">
        {/* Title and Metadata */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="truncate text-xs font-semibold text-foreground sm:text-sm">
              {fileName}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {fileSize ? `${fileSize} • ` : ""}
              {numPages > 0 ? `Page ${currentPage} of ${numPages}` : "PDF Document"}
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Page Navigation */}
          {numPages > 1 && (
            <div className="flex items-center rounded-xl border border-border bg-background p-0.5 shadow-xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="h-7 w-7 rounded-lg text-foreground hover:bg-secondary disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-[11px] font-semibold text-muted-foreground">
                {currentPage}/{numPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                className="h-7 w-7 rounded-lg text-foreground hover:bg-secondary disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Zoom Controls */}
          {numPages > 0 && (
            <div className="hidden items-center rounded-xl border border-border bg-background p-0.5 shadow-xs sm:flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomScale <= 0.6}
                className="h-7 w-7 rounded-lg text-foreground hover:bg-secondary disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="px-1.5 text-[11px] font-medium text-muted-foreground">
                {Math.round(zoomScale * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3.0}
                className="h-7 w-7 rounded-lg text-foreground hover:bg-secondary disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                className="h-7 w-7 rounded-lg text-foreground hover:bg-secondary"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Save Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="h-8 gap-1.5 rounded-xl border-border bg-background px-2.5 text-xs text-foreground shadow-xs hover:bg-secondary sm:px-3"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          {/* Close Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-slot="dialog-close"
            aria-label="Close"
            onClick={handleClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Viewport Container */}
      <div className="relative flex flex-1 items-start justify-center overflow-auto bg-muted/40 p-2 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:p-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs sm:text-sm font-medium">Rendering PDF...</p>
          </div>
        ) : error ? (
          <div className="flex max-w-sm flex-col items-center justify-center gap-3 p-6 text-center text-red-400">
            <AlertCircle className="h-8 w-8" />
            <p className="text-xs sm:text-sm font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              className="mt-2 rounded-xl border-border text-xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export PDF to Device
            </Button>
          </div>
        ) : (
          <div className="flex min-h-full flex-col items-center justify-center py-2">
            {rendering && (
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-xs backdrop-blur-xs">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Updating...</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="rounded-xl border border-border bg-white shadow-xl transition-all"
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
