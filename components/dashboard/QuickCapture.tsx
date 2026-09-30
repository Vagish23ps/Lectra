"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useEntryStore } from "@/store/entryStore";
import { Entry } from "@/types/entry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickCapture() {
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const addEntry = useEntryStore((state) => state.addEntry);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Please enter something to save");
      return;
    }

    try {
      setIsSaving(true);
      const newEntry: Entry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        entryName: trimmed,
        subject: "",
        lesson: "",
        notes: "",
        createdAt: new Date().toISOString(),
        tags: [],
        works: [],
        attachments: [],
      };

      addEntry(newEntry);
      setText("");
      toast.success("Saved to timeline");
    } catch (err) {
      console.error("Failed to quick-capture entry:", err);
      toast.error("Could not save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Card className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/40 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
      <CardContent className="p-2 sm:p-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to save?"
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden disabled:opacity-50"
              disabled={isSaving}
              maxLength={200}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || isSaving}
            className="h-8.5 rounded-xl px-3.5 text-xs font-semibold shrink-0 gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-40"
          >
            <span>Save</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
