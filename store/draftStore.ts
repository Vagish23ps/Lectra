import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkItem } from "@/types/entry";
import { CustomReminder } from "@/types/reminder";

export interface DraftEntry {
  entryName: string;
  subject: string;
  lesson: string;
  notes: string;
  tags: string[];
  works: WorkItem[];
  entryDate?: string;
  reminder?: CustomReminder;
}

interface DraftStore {
  draft: DraftEntry | null;
  updatedAt: number | null;

  saveDraft: (draft: DraftEntry) => void;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

export function isDraftEmpty(draft: DraftEntry | null): boolean {
  if (!draft) return true;
  return (
    !draft.entryName.trim() &&
    !draft.subject.trim() &&
    !draft.lesson.trim() &&
    !draft.notes.trim() &&
    (!draft.tags || draft.tags.length === 0) &&
    (!draft.works || draft.works.length === 0 || draft.works.every((w) => !w.task.trim())) &&
    !draft.reminder
  );
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      draft: null,
      updatedAt: null,

      saveDraft: (draft: DraftEntry) => {
        if (isDraftEmpty(draft)) {
          // Don't save empty drafts
          return;
        }
        set({ draft, updatedAt: Date.now() });
      },

      clearDraft: () => {
        set({ draft: null, updatedAt: null });
      },

      hasDraft: () => {
        const { draft } = get();
        return draft !== null && !isDraftEmpty(draft);
      },
    }),
    {
      name: "lectra-draft-storage",
    },
  ),
);
