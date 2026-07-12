import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Entry } from "@/types/entry";

interface EntryStore {
  entries: Entry[];

  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (entry: Entry) => void;
}

export const useEntryStore = create<EntryStore>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, entry],
        })),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter(
            (entry) => entry.id !== id
          ),
        })),

      updateEntry: (updatedEntry) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === updatedEntry.id
              ? updatedEntry
              : entry
          ),
        })),
    }),

    {
      name: "lectra-storage",
    }
  )
);