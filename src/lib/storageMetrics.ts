import { getAllAttachmentRecords, deleteAttachmentFile, formatFileSize } from "./attachmentStorage";
import { useEntryStore } from "@/store/entryStore";

export interface StorageMetrics {
  attachmentBytes: number;
  appDataBytes: number;
  totalBytes: number;
  formattedAttachments: string;
  formattedAppData: string;
  formattedTotal: string;
  attachmentCount: number;
  orphanedCount: number;
  orphanedBytes: number;
  formattedOrphaned: string;
}

export interface ManagedAttachmentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  formattedSize: string;
  isReferenced: boolean;
  linkedEntry?: {
    id: string;
    title: string;
  };
}

export async function calculateStorageMetrics(): Promise<{
  metrics: StorageMetrics;
  attachments: ManagedAttachmentItem[];
}> {
  // 1. Get real IndexedDB attachment records
  const attachmentRecords = await getAllAttachmentRecords();
  const entries = useEntryStore.getState().entries;

  let attachmentBytes = 0;
  let orphanedBytes = 0;
  let orphanedCount = 0;

  const managedAttachments: ManagedAttachmentItem[] = [];

  for (const record of attachmentRecords) {
    const size = record.size || record.blob?.size || 0;
    attachmentBytes += size;

    // Find linked entry
    const linkedEntry = entries.find((e) =>
      e.attachments?.some((att) => att.id === record.id)
    );

    const isReferenced = !!linkedEntry;

    if (!isReferenced) {
      orphanedCount++;
      orphanedBytes += size;
    }

    managedAttachments.push({
      id: record.id,
      name: record.name || "attachment",
      type: record.type || "application/octet-stream",
      size,
      formattedSize: formatFileSize(size),
      isReferenced,
      linkedEntry: linkedEntry
        ? {
            id: linkedEntry.id,
            title: linkedEntry.entryName || linkedEntry.subject || "Untitled Entry",
          }
        : undefined,
    });
  }

  // 2. Calculate real localStorage size
  let appDataBytes = 0;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("lectra") || key.includes("classlog"))) {
          const val = localStorage.getItem(key) || "";
          // String size in bytes (UTF-16 chars * 2)
          appDataBytes += (key.length + val.length) * 2;
        }
      }
    } catch (e) {
      console.warn("Could not measure localStorage size:", e);
    }
  }

  const totalBytes = attachmentBytes + appDataBytes;

  const metrics: StorageMetrics = {
    attachmentBytes,
    appDataBytes,
    totalBytes,
    formattedAttachments: formatFileSize(attachmentBytes),
    formattedAppData: formatFileSize(appDataBytes),
    formattedTotal: formatFileSize(totalBytes),
    attachmentCount: attachmentRecords.length,
    orphanedCount,
    orphanedBytes,
    formattedOrphaned: formatFileSize(orphanedBytes),
  };

  return {
    metrics,
    attachments: managedAttachments.sort((a, b) => b.size - a.size),
  };
}

/**
 * Deletes an attachment. If it is referenced by an entry, removes the attachment reference from the entry as well.
 */
export async function deleteManagedAttachment(
  attachmentId: string,
  removeFromEntry: boolean = true
): Promise<void> {
  // 1. Delete binary from IndexedDB
  await deleteAttachmentFile(attachmentId);

  // 2. If referenced, remove reference from entry
  if (removeFromEntry) {
    const entryStore = useEntryStore.getState();
    for (const entry of entryStore.entries) {
      if (entry.attachments?.some((att) => att.id === attachmentId)) {
        const updatedAttachments = entry.attachments.filter(
          (att) => att.id !== attachmentId
        );
        entryStore.updateEntry({
          ...entry,
          attachments: updatedAttachments,
        });
      }
    }
  }
}

/**
 * Purges all orphaned/unreferenced attachments from IndexedDB.
 */
export async function purgeOrphanedAttachments(): Promise<{
  deletedCount: number;
  freedBytes: number;
}> {
  const { attachments } = await calculateStorageMetrics();
  const orphaned = attachments.filter((a) => !a.isReferenced);

  let deletedCount = 0;
  let freedBytes = 0;

  for (const item of orphaned) {
    await deleteAttachmentFile(item.id);
    deletedCount++;
    freedBytes += item.size;
  }

  return {
    deletedCount,
    freedBytes,
  };
}
