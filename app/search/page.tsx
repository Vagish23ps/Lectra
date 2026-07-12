"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useEntryStore } from "@/store/entryStore";
import EntryCard from "@/components/dashboard/EntryCard";

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
          work.task.toLowerCase().includes(normalizedQuery)
        );

        return entryMatches || workMatches;
      })
    : [];

  return (
    <main className="min-h-screen bg-[#0B1120] px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold">
              Search
            </h1>

            <p className="text-sm text-slate-400">
              Find anything from your academic timeline
            </p>
          </div>
        </div>

        <div className="relative mt-8">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject, lesson, notes or tasks..."
            className="h-14 rounded-2xl border-slate-700 bg-[#111827] pl-12"
          />
        </div>

        {normalizedQuery && (
          <p className="mt-5 text-sm text-slate-400">
            {results.length}{" "}
            {results.length === 1 ? "entry" : "entries"} found
          </p>
        )}

        <section className="mt-5">
          {!normalizedQuery ? (
            <Card className="rounded-3xl border-slate-700 bg-[#111827]">
              <CardContent className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-slate-500" />

                <p className="text-slate-400">
                  Search your Lectra memory.
                </p>
              </CardContent>
            </Card>
          ) : results.length === 0 ? (
            <Card className="rounded-3xl border-slate-700 bg-[#111827]">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">
                  No matching entries found.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}