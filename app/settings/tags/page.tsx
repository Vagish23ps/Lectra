"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Tag as TagIcon,
  AlertTriangle,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTagStore, DEFAULT_TAGS } from "@/store/tagStore";
import { useEntryStore } from "@/store/entryStore";
import { Tag } from "@/types/tag";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TagsSettingsPage() {
  const router = useRouter();

  const customTags = useTagStore((state) => state.customTags);
  const addCustomTag = useTagStore((state) => state.addCustomTag);
  const renameCustomTag = useTagStore((state) => state.renameCustomTag);
  const deleteCustomTag = useTagStore((state) => state.deleteCustomTag);

  const entries = useEntryStore((state) => state.entries);
  const removeTagFromAllEntries = useEntryStore(
    (state) => state.removeTagFromAllEntries,
  );

  // Create Tag state
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Rename Tag state
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete Tag state
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const handleCreate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = addCustomTag(newTagName);
    if (!result.success || !result.tag) {
      toast.error(result.error || "Failed to create tag.");
      return;
    }

    setNewTagName("");
    setIsCreating(false);
    toast.success(`Tag "${result.tag.name}" created successfully.`);
  };

  const startRename = (tag: Tag) => {
    setEditingTag(tag);
    setRenameValue(tag.name);
  };

  const handleRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingTag) return;

    const result = renameCustomTag(editingTag.id, renameValue);
    if (!result.success) {
      toast.error(result.error || "Failed to rename tag.");
      return;
    }

    toast.success(`Tag renamed to "${renameValue.trim()}".`);
    setEditingTag(null);
    setRenameValue("");
  };

  const confirmDelete = () => {
    if (!deletingTag) return;

    deleteCustomTag(deletingTag.id);
    removeTagFromAllEntries(deletingTag.id);

    toast.success(`Tag "${deletingTag.name}" deleted.`);
    setDeletingTag(null);
  };

  const getEntryCount = (tagId: string) => {
    return entries.filter((e) => e.tags?.includes(tagId)).length;
  };

  return (
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/settings")}
            aria-label="Back to Settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Tags
            </h1>
            <p className="text-xs text-muted-foreground">
              Organize and categorize your entries
            </p>
          </div>
        </header>

        {/* Predefined Tags Section */}
        <section className="mt-6 sm:mt-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Predefined Tags
              </h2>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {DEFAULT_TAGS.length} Built-in
            </span>
          </div>

          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="mb-3.5 text-xs leading-relaxed text-muted-foreground">
                Built-in tags are permanently available across all entries and cannot be renamed or deleted.
              </p>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {DEFAULT_TAGS.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <span>{tag.name}</span>
                    <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {getEntryCount(tag.id)}
                    </span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Custom Tags Section */}
        <section className="mt-6 sm:mt-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Tags
              </h2>
            </div>

            {!isCreating && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="h-8 gap-1.5 rounded-xl px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Tag</span>
              </Button>
            )}
          </div>

          {/* Inline Creator */}
          <AnimatePresence>
            {isCreating && (
              <motion.form
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleCreate}
                className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/5 p-3 shadow-sm"
              >
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Internship, Gym, Placement..."
                  className="h-10 flex-1 rounded-xl bg-background text-sm"
                  autoFocus
                  maxLength={30}
                />
                <Button type="submit" className="h-10 rounded-xl px-3.5 text-xs font-semibold">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName("");
                  }}
                  className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {customTags.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-border bg-card/60 shadow-none">
              <CardContent className="flex flex-col items-center p-6 sm:p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <TagIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  No custom tags yet
                </h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Create custom tags to categorize your entries with specialized topics.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="mt-4 h-8 gap-1.5 rounded-xl border-dashed px-3 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Custom Tag</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {customTags.map((tag) => {
                const count = getEntryCount(tag.id);

                return (
                  <Card
                    key={tag.id}
                    className="overflow-hidden rounded-2xl border-border bg-card shadow-xs"
                  >
                    <CardContent className="flex items-center justify-between gap-3 p-3.5 sm:p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground font-semibold text-xs">
                          #
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {tag.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {count === 0
                              ? "Not used in any entry"
                              : `Used in ${count} entr${count === 1 ? "y" : "ies"}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startRename(tag)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label={`Rename ${tag.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingTag(tag)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${tag.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Rename Dialog */}
        <Dialog
          open={!!editingTag}
          onOpenChange={(open) => {
            if (!open) setEditingTag(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl border-border bg-popover p-5 sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground">
                Rename Tag
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleRename} className="mt-4 space-y-4">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Tag name..."
                className="h-11 rounded-xl bg-background text-sm"
                autoFocus
                maxLength={30}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTag(null)}
                  className="h-9 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 rounded-xl text-xs font-semibold"
                >
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingTag}
          onOpenChange={(open) => {
            if (!open) setDeletingTag(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl border-border bg-popover p-5 sm:max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-base font-semibold text-foreground">
                  Delete &quot;{deletingTag?.name}&quot;?
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {deletingTag && getEntryCount(deletingTag.id) > 0 ? (
                <p>
                  This tag is currently used in{" "}
                  <strong className="text-foreground">
                    {getEntryCount(deletingTag.id)}
                  </strong>{" "}
                  entr{getEntryCount(deletingTag.id) === 1 ? "y" : "ies"}.
                  Deleting it will remove the tag reference from those entries without deleting the entries.
                </p>
              ) : (
                <p>Are you sure you want to delete this custom tag?</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingTag(null)}
                className="h-9 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                className="h-9 rounded-xl text-xs font-semibold"
              >
                Delete Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
