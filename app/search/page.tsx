"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, FileSearch, Check, Tag as TagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { useEntryStore } from "@/store/entryStore";
import { useAllTags } from "@/store/tagStore";
import EntryCard from "@/components/dashboard/EntryCard";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants, listVariants } from "@/lib/animations";

export default function SearchPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);
  const allTags = useAllTags();
  const tagMap = useMemo(() => new Map(allTags.map((t) => [t.id, t.name.toLowerCase()])), [allTags]);

  const [query, setQuery] = useState("");
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);

  const normalizedQuery = query.trim().toLowerCase();

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagFilters((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const isFiltering = normalizedQuery.length > 0 || selectedTagFilters.length > 0;

  const results = isFiltering
    ? entries.filter((entry) => {
        // Tag filter check (OR rule: entry has ANY of the selected tags)
        if (selectedTagFilters.length > 0) {
          const entryTags = entry.tags || [];
          const hasMatchingTag = selectedTagFilters.some((filterId) =>
            entryTags.includes(filterId),
          );
          if (!hasMatchingTag) return false;
        }

        // Query text match check
        if (normalizedQuery) {
          const entryMatches =
            entry.entryName.toLowerCase().includes(normalizedQuery) ||
            entry.subject.toLowerCase().includes(normalizedQuery) ||
            entry.lesson.toLowerCase().includes(normalizedQuery) ||
            entry.notes.toLowerCase().includes(normalizedQuery);

          const workMatches = entry.works.some((work) =>
            work.task.toLowerCase().includes(normalizedQuery),
          );

          const tagMatches = (entry.tags || []).some((tId) => {
            const tagName = tagMap.get(tId) || tId.toLowerCase();
            return tagName.includes(normalizedQuery);
          });

          return entryMatches || workMatches || tagMatches;
        }

        return true;
      })
    : [];

  return (
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/")}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Search
            </h1>

            <p className="text-xs text-muted-foreground">
              Find anything you&apos;ve captured in Lectra
            </p>
          </div>
        </header>

        {/* Search Input */}
        <motion.section className="mt-5 sm:mt-6" variants={itemVariants}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries, subjects, notes or tasks..."
              className="h-12 rounded-2xl border-border bg-card pl-10 pr-10 text-sm text-foreground"
            />

            {query.length > 0 && (
              <button
                type="button"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.section>

        {/* Filter by Tag */}
        <motion.section className="mt-4" variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Filter by Tag
              </span>
            </div>

            {selectedTagFilters.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTagFilters([])}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear filters ({selectedTagFilters.length})
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const isSelected = selectedTagFilters.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {isFiltering && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {normalizedQuery ? (
                <>
                  Results for{" "}
                  <span className="font-semibold text-foreground">
                    &quot;{query.trim()}&quot;
                  </span>
                  {selectedTagFilters.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {" "}({selectedTagFilters.length} tag filter{selectedTagFilters.length > 1 ? "s" : ""})
                    </span>
                  )}
                </>
              ) : (
                <>
                  Filtered by{" "}
                  <span className="font-semibold text-foreground">
                    {selectedTagFilters.length} tag{selectedTagFilters.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </p>

            <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
              {results.length}
            </span>
          </div>
        )}

        {/* Search Results */}
        <motion.section className="mt-4 sm:mt-5" variants={listVariants}>
          {!isFiltering ? (
            <motion.div
              key="initial"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="rounded-3xl border-border bg-card shadow-sm">
                <CardContent className="flex flex-col items-center px-5 py-10 text-center sm:py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Search className="h-7 w-7 text-primary" />
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
                    Search your Lectra memory
                  </h2>

                  <p className="mt-1.5 max-w-xs text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    Find entries using names, tags, categories, key notes, additional notes or tasks.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : results.length === 0 ? (
            <motion.div
              key="empty"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="rounded-3xl border-border bg-card shadow-sm">
                <CardContent className="flex flex-col items-center px-5 py-10 text-center sm:py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <FileSearch className="h-7 w-7 text-muted-foreground" />
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
                    No matching entries
                  </h2>

                  <p className="mt-1.5 max-w-xs text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {normalizedQuery
                      ? `Nothing matched "${query.trim()}". Try a different search term or tag.`
                      : "No entries match the selected tag filters."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div className="space-y-3 sm:space-y-4" variants={listVariants}>
              <AnimatePresence mode="popLayout">
                {results.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <EntryCard entry={entry} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
