export interface AttachmentLike {
  name: string;
  mimeType: string;
  size?: number;
}

export interface AttachmentCountSummary {
  photos: number;
  pdfs: number;
  other: number;
  total: number;
}

export function getAttachmentCounts(attachments?: AttachmentLike[]): AttachmentCountSummary {
  if (!attachments || attachments.length === 0) {
    return { photos: 0, pdfs: 0, other: 0, total: 0 };
  }

  let photos = 0;
  let pdfs = 0;
  let other = 0;

  for (const att of attachments) {
    const isImage =
      att.mimeType.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(att.name);
    const isPdf =
      att.mimeType === "application/pdf" ||
      /\.pdf$/i.test(att.name);

    if (isImage) {
      photos++;
    } else if (isPdf) {
      pdfs++;
    } else {
      other++;
    }
  }

  return {
    photos,
    pdfs,
    other,
    total: attachments.length,
  };
}

export function formatAttachmentSummary(attachments?: AttachmentLike[]): string {
  const { photos, pdfs, other, total } = getAttachmentCounts(attachments);
  if (total === 0) return "";

  const parts: string[] = [];
  if (photos > 0) {
    parts.push(`${photos} ${photos === 1 ? "Photo" : "Photos"}`);
  }
  if (pdfs > 0) {
    parts.push(`${pdfs} ${pdfs === 1 ? "PDF" : "PDFs"}`);
  }
  if (other > 0) {
    parts.push(`${other} ${other === 1 ? "File" : "Files"}`);
  }

  return parts.join(" • ");
}
