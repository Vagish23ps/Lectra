import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Entry } from "@/types/entry";
import { notificationService } from "@/src/notifications/service";

interface EntryStore {
  entries: Entry[];
  hydrated: boolean;

  setHydrated: (value: boolean) => void;

  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (entry: Entry) => void;
  removeTagFromAllEntries: (tagId: string) => void;
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
        const updatedEntries = [...get().entries, entry];

        set({
          entries: updatedEntries,
        });

        void notificationService.refresh(updatedEntries);
      },

      deleteEntry: (id) => {
        const updatedEntries = get().entries.filter((entry) => entry.id !== id);

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
    }),

    {
      name: "lectra-storage",

      onRehydrateStorage: () => {
        console.log("🚨 ZUSTAND HYDRATION START");

        return (state) => {
          console.log("🚨 ZUSTAND HYDRATION FINISHED", state?.entries.length);

          state?.setHydrated(true);
        };
      },
    },
  ),
);
