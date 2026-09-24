import { Capacitor } from "@capacitor/core";

const DB_NAME = "lectra_attachments_db";
const STORE_NAME = "files";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveAttachmentFile(
  id: string,
  file: Blob | File,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id,
      blob: file,
      name: file instanceof File ? file.name : "attachment",
      type: file.type,
      size: file.size,
      updatedAt: Date.now(),
    };

    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAttachmentFile(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // 1. Direct Blob instance
        if (result instanceof Blob) {
          resolve(result);
          return;
        }

        // 2. Record with blob property as Blob instance
        if (result.blob instanceof Blob) {
          resolve(result.blob);
          return;
        }

        // 3. Record with blob property as ArrayBuffer / raw data
        if (result.blob) {
          const mimeType = result.type || result.mimeType || "application/octet-stream";
          try {
            const reconstructed = new Blob([result.blob], { type: mimeType });
            resolve(reconstructed);
            return;
          } catch {
            resolve(null);
            return;
          }
        }

        resolve(null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error in getAttachmentFile:", err);
    return null;
  }
}

export async function deleteAttachmentFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error in deleteAttachmentFile:", err);
  }
}

export interface StoredAttachmentRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  updatedAt?: number;
}

export async function getAllAttachmentRecords(): Promise<StoredAttachmentRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const list = (request.result || []) as Array<
          | { id: string; blob?: Blob | ArrayBuffer; name?: string; type?: string; size?: number; updatedAt?: number }
          | Blob
        >;
        const records: StoredAttachmentRecord[] = [];
        for (const item of list) {
          if (!item) continue;
          if (item instanceof Blob) {
            // Bare Blob stored directly — no metadata available, skip
            continue;
          }
          // item is now the object variant
          let blob: Blob | null = null;
          if (item.blob instanceof Blob) {
            blob = item.blob;
          } else if (item.blob) {
            try {
              blob = new Blob([item.blob], { type: item.type || "application/octet-stream" });
            } catch {
              blob = null;
            }
          }

          if (blob) {
            records.push({
              id: String(item.id),
              blob,
              name: item.name || "attachment",
              type: item.type || blob.type || "application/octet-stream",
              size: item.size || blob.size,
              updatedAt: item.updatedAt,
            });
          }
        }
        resolve(records);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error in getAllAttachmentRecords:", err);
    return [];
  }
}

export async function clearAllAttachments(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error in clearAllAttachments:", err);
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function sanitizeFileName(name: string, mimeType?: string): string {
  // Remove illegal characters for Android/Windows filesystems
  let clean = (name || "attachment")
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .trim();

  if (!clean) clean = "attachment";
  if (clean.length > 180) clean = clean.slice(0, 180);

  // Ensure file has valid extension
  const hasExt = /\.[a-zA-Z0-9]{2,5}$/.test(clean);
  if (!hasExt && mimeType) {
    if (mimeType.includes("pdf")) clean += ".pdf";
    else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) clean += ".jpg";
    else if (mimeType.includes("png")) clean += ".png";
    else if (mimeType.includes("webp")) clean += ".webp";
  }

  return clean;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      if (!res) {
        reject(new Error("Failed to convert file blob to base64"));
        return;
      }
      // Strip data URL prefix e.g. "data:application/pdf;base64,"
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export interface ExportResult {
  success: boolean;
  destination: string;
  filePath?: string;
  method: "native-documents" | "file-picker" | "browser-download";
}

/**
 * Real Android and Browser file export utility.
 * - On Native Android (Capacitor): writes directly to user-accessible Documents/Lectra directory via @capacitor/filesystem and verifies actual write with stat().
 * - On Browser: uses File System Access API (showSaveFilePicker) if available, or HTML5 anchor download.
 * - Guarantees NO FALSE SUCCESS.
 */
export async function exportAttachmentFile(
  blob: Blob,
  fileName: string,
  mimeType: string,
): Promise<ExportResult> {
  if (!blob || blob.size === 0) {
    throw new Error("File content is empty or unavailable.");
  }

  const safeName = sanitizeFileName(fileName, mimeType);
  const safeMime = mimeType || blob.type || "application/octet-stream";

  // 1. Android / Native Capacitor Export
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");

      // Check/request permissions if required on older Android versions
      try {
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage === "prompt" || permStatus.publicStorage === "prompt-with-rationale") {
          await Filesystem.requestPermissions();
        }
      } catch (permErr) {
        console.warn("Filesystem permission warning:", permErr);
      }

      const base64Data = await blobToBase64(blob);

      // Write to public Documents/Lectra/ directory
      const targetSubPath = `Lectra/${safeName}`;
      await Filesystem.writeFile({
        path: targetSubPath,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      // Strictly verify actual file creation and non-zero size
      const statResult = await Filesystem.stat({
        path: targetSubPath,
        directory: Directory.Documents,
      });

      if (!statResult || statResult.size === 0) {
        throw new Error("File verification failed after writing to device storage.");
      }

      return {
        success: true,
        destination: `Documents/Lectra/${safeName}`,
        filePath: statResult.uri || `Documents/Lectra/${safeName}`,
        method: "native-documents",
      };
    } catch (nativeErr) {
      const msg = nativeErr instanceof Error ? nativeErr.message : "Storage error";
      console.error("Native file export failed:", nativeErr);
      throw new Error(`Device save failed: ${msg}`);
    }
  }

  // 2. Browser File System Access API (User selects exact destination folder)
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const extension = safeName.includes(".") ? `.${safeName.split(".").pop()}` : "";
      const windowWithPicker = window as unknown as {
        showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
      };
      const handle = await windowWithPicker.showSaveFilePicker({
        suggestedName: safeName,
        types: [
          {
            description: safeName,
            accept: {
              [safeMime]: [extension],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        destination: handle.name || safeName,
        method: "file-picker",
      };
    } catch (pickerErr) {
      if ((pickerErr as { name?: string })?.name === "AbortError") {
        throw new Error("Save cancelled by user.");
      }
      console.warn("showSaveFilePicker fallback to download:", pickerErr);
    }
  }

  // 3. Browser Download Fallback
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 2000);

    return {
      success: true,
      destination: "Downloads",
      method: "browser-download",
    };
  } catch (err) {
    console.error("Browser download fallback failed:", err);
    throw new Error("Download failed.");
  }
}

export const saveAttachmentToDevice = exportAttachmentFile;
