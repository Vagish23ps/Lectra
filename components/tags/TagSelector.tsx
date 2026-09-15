"use client";

import { useState } from "react";
import { Plus, Check, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTagStore, useAllTags } from "@/store/tagStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagSelector({
  selectedTagIds,
  onChange,
}: TagSelectorProps) {
  const allTags = useAllTags();
  const addCustomTag = useTagStore((state) => state.addCustomTag);

  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreateTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = addCustomTag(newTagName);
    if (!result.success || !result.tag) {
      toast.error(result.error || "Failed to create tag.");
      return;
    }

    // Auto-select newly created tag
    onChange([...selectedTagIds, result.tag.id]);
    setNewTagName("");
    setIsCreating(false);
    toast.success(`Tag "${result.tag.name}" created.`);
  };

  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 w-full min-w-0">
        <label className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
          <TagIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">Tags</span>
        </label>

        {!isCreating && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-7 shrink-0 gap-1 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Tag</span>
          </Button>
        )}
      </div>

      {/* Inline Tag Creator */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onSubmit={handleCreateTag}
            className="box-border flex w-full min-w-0 max-w-full items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-2 sm:p-2.5"
          >
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="h-9 min-w-0 flex-1 rounded-xl bg-background text-xs"
              autoFocus
              maxLength={30}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 shrink-0 rounded-xl px-3 text-xs"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsCreating(false);
                setNewTagName("");
              }}
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tag Chips List */}
      <div className="flex w-full max-w-full flex-wrap gap-1.5">
        {allTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`inline-flex max-w-full min-h-[32px] items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all active:scale-95 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                  : "border-border bg-secondary/80 text-foreground hover:border-primary/50 hover:bg-secondary"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />}
              <span className="truncate max-w-[200px] sm:max-w-[280px]">{tag.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
