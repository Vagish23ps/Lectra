const DB_NAME = "lectra_attachments_db";
const STORE_NAME = "files";
const DB_VERSION = 1;

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

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Android WebView and Browser compatible save/download/export utility.
 * - Uses Web Share API (native Android system share/save sheet) if supported.
 * - Falls back to programmatic anchor download for browser environments.
 */
export async function exportAttachmentFile(
  blob: Blob,
  fileName: string,
  mimeType: string,
): Promise<{ success: boolean; method: "share" | "download" }> {
  const safeMime = mimeType || blob.type || "application/octet-stream";
  const file = new File([blob], fileName, { type: safeMime });

  // 1. Try Web Share API (opens native Android share/save sheet directly)
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
      });
      return { success: true, method: "share" };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return { success: true, method: "share" };
      }
      console.warn("navigator.share failed, falling back to download link:", err);
    }
  }

  // 2. Browser Anchor download fallback
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1500);
    return { success: true, method: "download" };
  } catch (err) {
    console.error("Browser download fallback failed:", err);
    throw err;
  }
}
