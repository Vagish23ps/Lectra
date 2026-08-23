"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Palette,
  Info,
  ChevronRight,
  Tag as TagIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/themeStore";
import { useTagStore } from "@/store/tagStore";

export default function SettingsPage() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const customTags = useTagStore((state) => state.customTags);

  const themeLabel =
    theme === "light"
      ? "Light"
      : theme === "dark"
      ? "Dark"
      : "System";

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
              Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Customize your app preferences
            </p>
          </div>
        </header>

        {/* Settings Navigation Cards */}
        <div className="mt-6 sm:mt-7 space-y-3 sm:space-y-3.5">
          {/* Notifications */}
          <div>
            <Card
              className="cursor-pointer overflow-hidden rounded-3xl border-border bg-card shadow-sm transition-all hover:border-primary/50 active:scale-[0.99]"
              onClick={() => router.push("/settings/notifications")}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      Notification Settings
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Manage your reminders and alerts
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* Tags & Categories */}
          <div>
            <Card
              className="cursor-pointer overflow-hidden rounded-3xl border-border bg-card shadow-sm transition-all hover:border-primary/50 active:scale-[0.99]"
              onClick={() => router.push("/settings/tags")}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <TagIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      Tags &amp; Categories
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Manage predefined and custom tags
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {customTags.length > 0 && (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {customTags.length} Custom
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appearance */}
          <div>
            <Card
              className="cursor-pointer overflow-hidden rounded-3xl border-border bg-card shadow-sm transition-all hover:border-primary/50 active:scale-[0.99]"
              onClick={() => router.push("/settings/appearance")}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      Appearance
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Theme and display
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {themeLabel}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About Lectra */}
          <div>
            <Card
              className="cursor-pointer overflow-hidden rounded-3xl border-border bg-card shadow-sm transition-all hover:border-primary/50 active:scale-[0.99]"
              onClick={() => router.push("/settings/about")}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      About Lectra
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      App information & overview
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                    v1.0.0
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
