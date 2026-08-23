import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Tag } from "@/types/tag";

export const DEFAULT_TAGS: Tag[] = [
  { id: "personal", name: "Personal", isDefault: true },
  { id: "study", name: "Study", isDefault: true },
  { id: "work", name: "Work", isDefault: true },
  { id: "important", name: "Important", isDefault: true },
  { id: "idea", name: "Idea", isDefault: true },
  { id: "project", name: "Project", isDefault: true },
  { id: "meeting", name: "Meeting", isDefault: true },
  { id: "reminder", name: "Reminder", isDefault: true },
  { id: "college", name: "College", isDefault: true },
  { id: "assignment", name: "Assignment", isDefault: true },
];

interface TagStore {
  customTags: Tag[];
  getTagById: (id: string) => Tag | undefined;
  addCustomTag: (name: string) => { success: boolean; tag?: Tag; error?: string };
  renameCustomTag: (id: string, newName: string) => { success: boolean; error?: string };
  deleteCustomTag: (id: string) => { success: boolean; error?: string };
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      customTags: [],

      getTagById: (id: string) => {
        const all = [...DEFAULT_TAGS, ...get().customTags];
        return all.find((t) => t.id.toLowerCase() === id.toLowerCase());
      },

      addCustomTag: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return { success: false, error: "Tag name cannot be empty." };
        }

        const allTags = [...DEFAULT_TAGS, ...get().customTags];
        const exists = allTags.some(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
        );

        if (exists) {
          return { success: false, error: `Tag "${trimmed}" already exists.` };
        }

        const newTag: Tag = {
          id: `tag-${crypto.randomUUID()}`,
          name: trimmed,
          isDefault: false,
        };

        set({
          customTags: [...get().customTags, newTag],
        });

        return { success: true, tag: newTag };
      },

      renameCustomTag: (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) {
          return { success: false, error: "Tag name cannot be empty." };
        }

        const isDefault = DEFAULT_TAGS.some((t) => t.id === id);
        if (isDefault) {
          return { success: false, error: "Predefined tags cannot be renamed." };
        }

        const allTags = [...DEFAULT_TAGS, ...get().customTags];
        const exists = allTags.some(
          (t) => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase(),
        );

        if (exists) {
          return { success: false, error: `Tag "${trimmed}" already exists.` };
        }

        set({
          customTags: get().customTags.map((t) =>
            t.id === id ? { ...t, name: trimmed } : t,
          ),
        });

        return { success: true };
      },

      deleteCustomTag: (id: string) => {
        const isDefault = DEFAULT_TAGS.some((t) => t.id === id);
        if (isDefault) {
          return { success: false, error: "Predefined tags cannot be deleted." };
        }

        set({
          customTags: get().customTags.filter((t) => t.id !== id),
        });

        return { success: true };
      },
    }),
    {
      name: "lectra-tags-storage",
    },
  ),
);

export function useAllTags(): Tag[] {
  const customTags = useTagStore((state) => state.customTags);
  return useMemo(() => [...DEFAULT_TAGS, ...customTags], [customTags]);
}
