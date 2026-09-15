"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HardDrive,
  Paperclip,
  Database,
  Trash2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  calculateStorageMetrics,
  deleteManagedAttachment,
  purgeOrphanedAttachments,
  StorageMetrics,
  ManagedAttachmentItem,
} from "@/src/lib/storageMetrics";
import { formatFileSize, getAttachmentFile } from "@/src/lib/attachmentStorage";
import AttachmentPreviewModal from "@/components/attachments/AttachmentPreviewModal";

export default function StoragePage() {
  const router = useRouter();

  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [attachments, setAttachments] = useState<ManagedAttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [deletingItem, setDeletingItem] = useState<ManagedAttachmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const [previewItem, setPreviewItem] = useState<ManagedAttachmentItem | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await calculateStorageMetrics();
      setMetrics(data.metrics);
      setAttachments(data.attachments);
    } catch (err) {
      console.error("Failed to load storage metrics:", err);
      toast.error("Could not calculate storage usage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, []);

  useEffect(() => {
    const imageAtts = attachments.filter(
      (a) => a.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(a.name)
    );
    
    const urls = new Map<string, string>();
    
    Promise.all(
      imageAtts.map(async (att) => {
        try {
          const blob = await getAttachmentFile(att.id);
          if (blob) {
            urls.set(att.id, URL.createObjectURL(blob));
          }
        } catch {}
      })
    ).then(() => setThumbnailUrls(new Map(urls)));
    
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      await deleteManagedAttachment(deletingItem.id, true);
      toast.success(`Removed ${deletingItem.name}`);
      setDeletingItem(null);
      await loadMetrics();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Could not delete attachment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeOrphans = async () => {
    try {
      setIsPurging(true);
      const result = await purgeOrphanedAttachments();
      toast.success(
        `Cleaned up ${result.deletedCount} unreferenced files (${formatFileSize(result.freedBytes)} freed)`
      );
      await loadMetrics();
    } catch (err) {
      console.error("Purge failed:", err);
      toast.error("Failed to clean up unreferenced attachments.");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <main className="px-4 sm:px-5 text-foreground pb-12">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/settings")}
            aria-label="Back to Settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Storage
            </h1>
            <p className="text-xs text-muted-foreground">
              Inspect and manage local attachments and app data
            </p>
          </div>
        </header>

        {/* Real Storage Breakdown Cards */}
        <section className="mt-6 sm:mt-7">
          <Card className="rounded-3xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      Total Storage Used
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Calculated from real local databases
                    </p>
                  </div>
                </div>

                <span className="text-lg sm:text-xl font-bold text-foreground">
                  {loading ? "..." : metrics?.formattedTotal || "0 B"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/80 bg-background/50 p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-xs font-semibold text-foreground">Attachments</span>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-bold text-foreground">
                    {loading ? "..." : metrics?.formattedAttachments || "0 B"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {metrics?.attachmentCount || 0} stored files
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/50 p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Database className="h-4 w-4" />
                    <span className="text-xs font-semibold text-foreground">Application Data</span>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-bold text-foreground">
                    {loading ? "..." : metrics?.formattedAppData || "0 B"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Entries &amp; preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Orphan Cleanup Banner (if unreferenced files exist) */}
        {metrics && metrics.orphanedCount > 0 && (
          <section className="mt-4 sm:mt-5">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {metrics.orphanedCount} Unreferenced{" "}
                      {metrics.orphanedCount === 1 ? "Attachment" : "Attachments"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {metrics.formattedOrphaned} of unlinked attachment data can be safely removed.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePurgeOrphans}
                  disabled={isPurging}
                  className="rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-semibold shrink-0 gap-1.5 hover:bg-amber-500/10"
                >
                  {isPurging ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Clean Up</span>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Manage Attachments Section */}
        <section className="mt-6 sm:mt-7">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Manage Attachments
            </h3>

            {attachments.length > 0 && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                {attachments.length} Total
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-3.5 flex justify-center py-8 text-xs text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : attachments.length === 0 ? (
            <Card className="mt-3.5 rounded-3xl border-border bg-card shadow-xs">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Paperclip className="h-8 w-8 text-muted-foreground/60" />
                <p className="mt-2 text-xs sm:text-sm font-semibold text-foreground">
                  No attachments stored
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Photos and PDF documents attached to entries will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {attachments.map((att) => {
                const isPdf = att.type.includes("pdf") || att.name.endsWith(".pdf");
                const isImage = att.type.startsWith("image/");
                const thumbUrl = thumbnailUrls.get(att.id);

                return (
                  <div
                    key={att.id}
                    onClick={() => setPreviewItem(att)}
                    className="cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/40 active:scale-[0.98]"
                  >
                    {/* Thumbnail / Icon */}
                    <div className="relative aspect-square w-full overflow-hidden bg-secondary/30">
                      {isImage && thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={att.name}
                          className="h-full w-full object-cover"
                        />
                      ) : isPdf ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-red-500/5">
                          <FileText className="h-8 w-8 text-red-500" />
                          <span className="mt-1 text-[10px] font-semibold text-red-500">PDF</span>
                        </div>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      {!att.isReferenced && (
                        <div className="absolute right-1.5 top-1.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          Orphan
                        </div>
                      )}
                    </div>
                    {/* File Info */}
                    <div className="p-2.5">
                      <p className="truncate text-[11px] font-semibold text-foreground">{att.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{att.formattedSize}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Attachment Preview Modal */}
        <AttachmentPreviewModal
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          attachment={previewItem}
          onDelete={() => {
            if (previewItem) {
              setDeletingItem(previewItem);
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Delete Attachment?
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {deletingItem?.isReferenced ? (
                  <>
                    <strong className="text-foreground">{deletingItem.name}</strong> is currently
                    linked to the entry{" "}
                    <strong className="text-foreground">
                      &quot;{deletingItem.linkedEntry?.title}&quot;
                    </strong>
                    . Deleting it will permanently remove the file and unlink it from the entry.
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-foreground">{deletingItem?.name}</strong>?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="rounded-xl text-xs flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl text-xs font-semibold flex-1 sm:flex-none gap-1.5"
              >
                {isDeleting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete File</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
