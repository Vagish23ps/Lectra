"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, FileSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { useEntryStore } from "@/store/entryStore";
import EntryCard from "@/components/dashboard/EntryCard";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants, listVariants } from "@/lib/animations";

export default function SearchPage() {
  const router = useRouter();

  const entries = useEntryStore((state) => state.entries);

  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const results = normalizedQuery
    ? entries.filter((entry) => {
        const entryMatches =
          entry.entryName.toLowerCase().includes(normalizedQuery) ||
          entry.subject.toLowerCase().includes(normalizedQuery) ||
          entry.lesson.toLowerCase().includes(normalizedQuery) ||
          entry.notes.toLowerCase().includes(normalizedQuery);

        const workMatches = entry.works.some((work) =>
          work.task.toLowerCase().includes(normalizedQuery),
        );

        return entryMatches || workMatches;
      })
    : [];

  return (
    <motion.main
      className="min-h-screen bg-background px-5 pb-8 pt-7 text-foreground"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}

        <header className="flex items-start gap-4">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Search
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Find anything you've captured in Lectra.
            </p>
          </div>
        </header>

        {/* Search Input */}

        <motion.section className="mt-8" variants={itemVariants}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries, categories, notes or tasks..."
              className="h-14 rounded-2xl border-border bg-card pl-12 pr-12 text-foreground"
            />

            {query.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {normalizedQuery && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Results for{" "}
                <span className="font-medium text-foreground">
                  "{query.trim()}"
                </span>
              </p>

              <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                {results.length}
              </span>
            </div>
          )}
        </motion.section>

        {/* Search Results */}

        <motion.section className="mt-5" variants={listVariants}>
          {!normalizedQuery ? (
            <motion.div
              key="initial"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="rounded-3xl border-border bg-card">
                <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Search className="h-8 w-8 text-primary" />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-foreground">
                    Search your Lectra memory
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Find entries using names, categories, key notes, additional
                    notes or tasks.
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
              <Card className="rounded-3xl border-border bg-card">
                <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                    <FileSearch className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-foreground">
                    No matching entries
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Nothing matched "{query.trim()}". Try a different word or
                    phrase.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div className="space-y-4" variants={listVariants}>
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
    </motion.main>
  );
}
