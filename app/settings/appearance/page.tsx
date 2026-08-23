"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Sun, Moon, Laptop, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useThemeStore, ThemeMode } from "@/store/themeStore";

interface ThemeOption {
  id: ThemeMode;
  title: string;
  description: string;
  icon: typeof Sun;
  colorClass: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: "system",
    title: "System Default",
    description: "Match your device's system appearance settings automatically.",
    icon: Laptop,
    colorClass: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  },
  {
    id: "light",
    title: "Light Mode",
    description: "Clean, crisp light appearance with comfortable contrast.",
    icon: Sun,
    colorClass: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  {
    id: "dark",
    title: "Dark Mode",
    description: "Lectra's signature deep navy theme, easy on the eyes.",
    icon: Moon,
    colorClass: "bg-purple-500/10 text-purple-500 dark:text-purple-400",
  },
];

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

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
              Appearance
            </h1>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color theme
            </p>
          </div>
        </header>

        {/* Theme Options */}
        <div className="mt-6 sm:mt-7 space-y-3 sm:space-y-3.5">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            const Icon = opt.icon;

            return (
              <Card
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`cursor-pointer overflow-hidden rounded-3xl border transition-all active:scale-[0.99] ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card shadow-sm hover:border-primary/40"
                }`}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${opt.colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-foreground">
                        {opt.title}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
