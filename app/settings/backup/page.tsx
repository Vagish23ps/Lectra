"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Upload,
  FileArchive,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Layers,
  Paperclip,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEntryStore } from "@/store/entryStore";
import { useTagStore } from "@/store/tagStore";
import {
  exportFullBackup,
  validateBackupZip,
  restoreFullBackup,
  BackupManifest,
} from "@/src/lib/backupService";

export default function BackupRestorePage() {
  const router = useRouter();
  const entries = useEntryStore((state) => state.entries);
  const customTags = useTagStore((state) => state.customTags);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<{
    fileName: string;
    destination: string;
  } | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewManifest, setPreviewManifest] = useState<BackupManifest | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalAttachments = entries.reduce(
    (acc, e) => acc + (e.attachments?.length || 0),
    0
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(null);
      const result = await exportFullBackup();
      setExportSuccess({
        fileName: result.fileName,
        destination: result.destination,
      });
      toast.success("Backup exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      const message = err instanceof Error ? err.message : "Failed to export backup.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewManifest(null);
    setIsValidating(true);

    try {
      const validation = await validateBackupZip(file);
      if (!validation.isValid || !validation.manifest) {
        toast.error(validation.error || "Selected file is not a valid Lectra backup archive.");
        setSelectedFile(null);
        return;
      }
      setPreviewManifest(validation.manifest);
      toast.success("Backup archive verified and ready to restore.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not read backup file.";
      toast.error(message);
      setSelectedFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    try {
      setIsImporting(true);
      const result = await restoreFullBackup(selectedFile);
      toast.success(
        `Successfully restored ${result.restoredEntries} entries and ${result.restoredAttachments} attachments!`
      );
      setSelectedFile(null);
      setPreviewManifest(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Restore error:", err);
      const message = err instanceof Error ? err.message : "Failed to restore backup.";
      toast.error(message);
    } finally {
      setIsImporting(false);
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
              Backup &amp; Restore
            </h1>
            <p className="text-xs text-muted-foreground">
              Securely export or restore all your entries, reminders, and attachments
            </p>
          </div>
        </header>

        {/* Current State Summary */}
        <section className="mt-6 sm:mt-7">
          <Card className="rounded-3xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Application Data
              </h2>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
                  <div className="flex justify-center text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
                    {entries.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Entries</p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
                  <div className="flex justify-center text-amber-500">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
                    {totalAttachments}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Attachments</p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
                  <div className="flex justify-center text-emerald-500">
                    <Tag className="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
                    {customTags.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Custom Tags</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Export Backup Section */}
        <section className="mt-5 sm:mt-6">
          <Card className="rounded-3xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">
                    Export Backup
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Creates a complete .zip package containing all data and stored files
                  </p>
                </div>
              </div>

              {exportSuccess && (
                <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-3 sm:p-3.5 text-xs">
                  <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Backup Saved</p>
                      <p className="mt-0.5 text-[11px] opacity-90 break-all">
                        {exportSuccess.destination}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full rounded-2xl py-5 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-98 gap-2"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Creating Backup Package...</span>
                    </>
                  ) : (
                    <>
                      <FileArchive className="h-4 w-4" />
                      <span>Export Backup (.zip)</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Import Backup Section */}
        <section className="mt-5 sm:mt-6">
          <Card className="rounded-3xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">
                    Import Backup
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Restore your entries, attachments, and settings from an existing backup
                  </p>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File Selection / Validation State */}
              {previewManifest && selectedFile ? (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <FileCheck className="h-4 w-4" />
                      <span>Backup Archive Verified</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(previewManifest.exportedAt), "dd MMM yyyy, hh:mm a")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-foreground">
                    <div className="rounded-xl bg-background/80 p-2">
                      <p className="text-sm font-bold">{previewManifest.stats.entries}</p>
                      <p className="text-[10px] text-muted-foreground">Entries</p>
                    </div>
                    <div className="rounded-xl bg-background/80 p-2">
                      <p className="text-sm font-bold">{previewManifest.stats.attachments}</p>
                      <p className="text-[10px] text-muted-foreground">Attachments</p>
                    </div>
                    <div className="rounded-xl bg-background/80 p-2">
                      <p className="text-sm font-bold">{previewManifest.stats.tags}</p>
                      <p className="text-[10px] text-muted-foreground">Tags</p>
                    </div>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewManifest(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="flex-1 rounded-xl text-xs"
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRestore}
                      disabled={isImporting}
                      className="flex-1 rounded-xl text-xs font-semibold gap-1.5"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Restoring...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Restore Data</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isValidating}
                    className="w-full rounded-2xl border-border bg-background py-5 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-98 gap-2"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Validating Archive...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Select Backup Archive (.zip)</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
