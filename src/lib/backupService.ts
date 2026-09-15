import JSZip from "jszip";
import { format } from "date-fns";
import { useEntryStore } from "@/store/entryStore";
import { useTagStore } from "@/store/tagStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { useThemeStore } from "@/store/themeStore";
import {
  getAllAttachmentRecords,
  saveAttachmentFile,
  exportAttachmentFile,
  ExportResult,
} from "./attachmentStorage";
import { notificationService } from "@/src/notifications/service";

export interface BackupManifest {
  version: string;
  app: string;
  exportedAt: string;
  stats: {
    entries: number;
    tags: number;
    attachments: number;
    notifications: number;
  };
}

export interface BackupData {
  entries: any[];
  customTags: any[];
  notificationSettings?: any;
  notifications?: any[];
  clearedIds?: string[];
  theme?: string;
  attachmentMeta?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    zipPath: string;
  }>;
}

export interface BackupExportResult {
  success: boolean;
  fileName: string;
  destination: string;
  entryCount: number;
  attachmentCount: number;
}

export interface BackupRestoreResult {
  success: boolean;
  restoredEntries: number;
  restoredAttachments: number;
  restoredTags: number;
  exportedAt: string;
}

/**
 * Creates and exports a full Lectra backup .zip archive containing:
 * - manifest.json (metadata & stats)
 * - data.json (all entries, tags, settings, history)
 * - attachments/ (all binary photo/pdf blobs from IndexedDB)
 */
export async function exportFullBackup(): Promise<BackupExportResult> {
  const entries = useEntryStore.getState().entries;
  const customTags = useTagStore.getState().customTags;
  const notificationSettings = useNotificationSettingsStore.getState();
  const notificationHistory = useNotificationStore.getState().notifications;
  const clearedIds = useNotificationStore.getState().clearedIds;
  const theme = useThemeStore.getState().theme;

  const storedAttachments = await getAllAttachmentRecords();

  const zip = new JSZip();

  // 1. Build attachment meta and add binary files to attachments/ folder
  const attachmentsFolder = zip.folder("attachments");
  const attachmentMeta: BackupData["attachmentMeta"] = [];

  if (attachmentsFolder) {
    for (const att of storedAttachments) {
      const zipPath = `${att.id}`;
      attachmentsFolder.file(zipPath, att.blob);
      attachmentMeta.push({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        zipPath,
      });
    }
  }

  // 2. Build manifest.json
  const manifest: BackupManifest = {
    version: "1.0",
    app: "Lectra",
    exportedAt: new Date().toISOString(),
    stats: {
      entries: entries.length,
      tags: customTags.length,
      attachments: storedAttachments.length,
      notifications: notificationHistory.length,
    },
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 3. Build data.json
  const backupData: BackupData = {
    entries,
    customTags,
    notificationSettings,
    notifications: notificationHistory,
    clearedIds,
    theme,
    attachmentMeta,
  };
  zip.file("data.json", JSON.stringify(backupData, null, 2));

  // 4. Generate zip blob
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
  const fileName = `Lectra_Backup_${timestamp}.zip`;

  // 5. Export to native Android Documents/Lectra/ or browser download
  const exportResult: ExportResult = await exportAttachmentFile(
    zipBlob,
    fileName,
    "application/zip"
  );

  return {
    success: true,
    fileName,
    destination: exportResult.destination,
    entryCount: entries.length,
    attachmentCount: storedAttachments.length,
  };
}

/**
 * Validates a backup .zip file without modifying application state.
 */
export async function validateBackupZip(file: File | Blob): Promise<{
  isValid: boolean;
  manifest?: BackupManifest;
  data?: BackupData;
  error?: string;
}> {
  try {
    const zip = await JSZip.loadAsync(file);

    const manifestFile = zip.file("manifest.json");
    const dataFile = zip.file("data.json");

    if (!manifestFile || !dataFile) {
      return {
        isValid: false,
        error: "Invalid backup format: missing manifest.json or data.json.",
      };
    }

    const manifestStr = await manifestFile.async("string");
    const dataStr = await dataFile.async("string");

    const manifest = JSON.parse(manifestStr) as BackupManifest;
    const data = JSON.parse(dataStr) as BackupData;

    if (!Array.isArray(data.entries)) {
      return {
        isValid: false,
        error: "Invalid backup data: entries list is corrupted or missing.",
      };
    }

    return {
      isValid: true,
      manifest,
      data,
    };
  } catch (err: any) {
    console.error("Backup validation error:", err);
    return {
      isValid: false,
      error: `Failed to read backup file: ${err?.message || "Corrupted archive"}`,
    };
  }
}

/**
 * Restores a full backup .zip archive into IndexedDB and application state.
 * Validates before applying changes. If validation fails, current data is preserved untouched.
 */
export async function restoreFullBackup(file: File | Blob): Promise<BackupRestoreResult> {
  const validation = await validateBackupZip(file);
  if (!validation.isValid || !validation.data) {
    throw new Error(validation.error || "Backup validation failed.");
  }

  const { data, manifest } = validation;
  const zip = await JSZip.loadAsync(file);
  const attachmentsFolder = zip.folder("attachments");

  let restoredAttachments = 0;

  // 1. Restore attachments into IndexedDB
  if (attachmentsFolder && data.attachmentMeta && data.attachmentMeta.length > 0) {
    for (const meta of data.attachmentMeta) {
      const attZipFile = attachmentsFolder.file(meta.zipPath) || zip.file(`attachments/${meta.zipPath}`);
      if (attZipFile) {
        try {
          const arrayBuffer = await attZipFile.async("arraybuffer");
          const mimeType = meta.type || "application/octet-stream";
          const blob = new Blob([arrayBuffer], { type: mimeType });
          const fileObj = new File([blob], meta.name || "attachment", { type: mimeType });

          await saveAttachmentFile(meta.id, fileObj);
          restoredAttachments++;
        } catch (attErr) {
          console.warn(`Failed to restore attachment ${meta.id}:`, attErr);
        }
      }
    }
  }

  // 2. Restore Zustand application stores
  useEntryStore.setState({ entries: data.entries || [] });

  if (Array.isArray(data.customTags)) {
    useTagStore.setState({ customTags: data.customTags });
  }

  if (Array.isArray(data.notifications)) {
    useNotificationStore.setState({
      notifications: data.notifications,
      clearedIds: data.clearedIds || [],
    });
  }

  if (data.notificationSettings) {
    useNotificationSettingsStore.setState(data.notificationSettings);
  }

  if (data.theme && (data.theme === "light" || data.theme === "dark" || data.theme === "system")) {
    useThemeStore.getState().setTheme(data.theme as any);
  }

  // 3. Re-schedule active notifications/reminders with the restored entries
  void notificationService.refresh(data.entries || []);

  return {
    success: true,
    restoredEntries: (data.entries || []).length,
    restoredAttachments,
    restoredTags: (data.customTags || []).length,
    exportedAt: manifest?.exportedAt || new Date().toISOString(),
  };
}
