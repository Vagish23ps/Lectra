import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Entry, WorkItem } from "@/types/entry";
import { CustomReminder } from "@/types/reminder";
import { notificationService } from "@/src/notifications/service";
import { deleteAttachmentFile } from "@/src/lib/attachmentStorage";
import { toast } from "sonner";

interface EntryStore {
  entries: Entry[];
  hydrated: boolean;

  setHydrated: (value: boolean) => void;

  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (entry: Entry) => void;
  toggleWorkCompleted: (entryId: string, workId: string) => void;
  addInlineWork: (entryId: string, task: string, deadline?: string, addToPending?: boolean) => void;
  removeTagFromAllEntries: (tagId: string) => void;
  replaceTagInAllEntries: (oldTagId: string, newTagId: string) => void;
  updateReminder: (entryId: string, workId: string | null, reminder: CustomReminder | undefined) => void;
}

export const useEntryStore = create<EntryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,

      setHydrated: (value) => {
        set({ hydrated: value });
      },

      addEntry: (entry) => {
        const current = get().entries;
        // Deduplication guard: update if already exists, else prepend
        const exists = current.some((e) => e.id === entry.id);
        const updatedEntries = exists
          ? current.map((e) => (e.id === entry.id ? entry : e))
          : [entry, ...current];

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },

      deleteEntry: (id) => {
        const current = get().entries;
        const target = current.find((e) => e.id === id);

        // Clean up stored attachments from IndexedDB to prevent orphaned files
        if (target?.attachments && target.attachments.length > 0) {
          for (const att of target.attachments) {
            void deleteAttachmentFile(att.id);
          }
        }

        const updatedEntries = current.filter((entry) => entry.id !== id);

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },

      updateEntry: (updatedEntry) => {
        const updatedEntries = get().entries.map((entry) =>
          entry.id === updatedEntry.id ? updatedEntry : entry,
        );

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },

      toggleWorkCompleted: (entryId: string, workId: string) => {
        const current = get().entries;
        const targetEntry = current.find((e) => e.id === entryId);
        if (!targetEntry) return;

        const targetWork = targetEntry.works.find((w) => w.id === workId);
        if (!targetWork) return;

        const willBeCompleted = !targetWork.completed;

        const updatedEntries = current.map((entry) => {
          if (entry.id !== entryId) return entry;
          return {
            ...entry,
            works: entry.works.map((work) =>
              work.id === workId ? { ...work, completed: willBeCompleted } : work,
            ),
          };
        });

        set({ entries: updatedEntries });
        void notificationService.refresh(updatedEntries);

        if (willBeCompleted) {
          toast("Task completed", {
            action: {
              label: "Undo",
              onClick: () => {
                get().toggleWorkCompleted(entryId, workId);
              },
            },
            duration: 3500,
          });
        }
      },

      addInlineWork: (entryId: string, task: string, deadline?: string, addToPending?: boolean) => {
        if (!task.trim()) return;
        const current = get().entries;
        const targetEntry = current.find((e) => e.id === entryId);
        if (!targetEntry) return;

        const newWork: WorkItem = {
          id: crypto.randomUUID(),
          task: task.trim(),
          completed: false,
          deadline: deadline || "",
          addToPending: addToPending ?? false,
        };

        const updatedEntries = current.map((entry) => {
          if (entry.id !== entryId) return entry;
          return {
            ...entry,
            works: [...entry.works, newWork],
          };
        });

        set({ entries: updatedEntries });
        void notificationService.refresh(updatedEntries);
        toast.success("Task added");
      },

      removeTagFromAllEntries: (tagId: string) => {
        const updatedEntries = get().entries.map((entry) => {
          if (!entry.tags || !entry.tags.includes(tagId)) {
            return entry;
          }
          return {
            ...entry,
            tags: entry.tags.filter((t) => t !== tagId),
          };
        });

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },

      replaceTagInAllEntries: (oldTagId: string, newTagId: string) => {
        const updatedEntries = get().entries.map((entry) => {
          if (!entry.tags || !entry.tags.includes(oldTagId)) {
            return entry;
          }
          const newTags = Array.from(
            new Set(entry.tags.map((t) => (t === oldTagId ? newTagId : t)))
          );
          return {
            ...entry,
            tags: newTags,
          };
        });

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },

      updateReminder: (entryId: string, workId: string | null, reminder: CustomReminder | undefined) => {
        const updatedEntries = get().entries.map((entry) => {
          if (entry.id !== entryId) return entry;

          if (workId) {
            // Task-level reminder
            return {
              ...entry,
              works: entry.works.map((work) =>
                work.id === workId ? { ...work, reminder } : work,
              ),
            };
          }

          // Entry-level reminder
          return { ...entry, reminder };
        });

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },
    }),

    {
      name: "lectra-storage",

      onRehydrateStorage: () => {
        console.log("🚨 ZUSTAND HYDRATION START");

        return (state) => {
          console.log("🚨 ZUSTAND HYDRATION FINISHED", state?.entries.length);

          if (state?.entries) {
            // Normalize any legacy tag names like "Course" or "Exam" to standard built-in IDs "course", "exam"
            let modified = false;
            const updated = state.entries.map((entry) => {
              if (!entry.tags || entry.tags.length === 0) return entry;
              let tagsChanged = false;
              const mappedTags = entry.tags.map((t) => {
                if (t.toLowerCase() === "course" && t !== "course") {
                  tagsChanged = true;
                  return "course";
                }
                if (t.toLowerCase() === "exam" && t !== "exam") {
                  tagsChanged = true;
                  return "exam";
                }
                return t;
              });
              const uniqueTags = Array.from(new Set(mappedTags));
              if (tagsChanged || uniqueTags.length !== entry.tags.length) {
                modified = true;
                return { ...entry, tags: uniqueTags };
              }
              return entry;
            });
            if (modified) {
              state.entries = updated;
            }
          }

          state?.setHydrated(true);
        };
      },
    },
  ),
);
