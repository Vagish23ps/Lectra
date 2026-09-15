"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  CalendarDays,
  Bell,
  Clock,
  Search,
  Paperclip,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Quick Capture",
    description: "Instantly capture notes, thoughts, and tasks in a single tap.",
    icon: FileText,
  },
  {
    title: "Tasks & Deadlines",
    description: "Track work items with precise due dates and priority indicators.",
    icon: Clock,
  },
  {
    title: "Custom Reminders",
    description: "Set one-time alarms for specific dates and times.",
    icon: Bell,
  },
  {
    title: "Recurring Reminders",
    description: "Repeat notifications daily, weekly, monthly, or on selected days.",
    icon: Bell,
  },
  {
    title: "Notification Center",
    description: "Reliable alarms for due today, due tomorrow, and overdue items.",
    icon: Bell,
  },
  {
    title: "Calendar",
    description: "Timeline view with instant status indicators and month swipe navigation.",
    icon: CalendarDays,
  },
  {
    title: "Pending Task Tracking",
    description: "Dedicated dashboard for overdue, today, tomorrow, and remaining tasks.",
    icon: CheckCircle2,
  },
  {
    title: "Tags & Categories",
    description: "Organize entries with color-coded custom tags and categories.",
    icon: FileText,
  },
  {
    title: "Search",
    description: "Instant search across all entries, tasks, subjects, and notes.",
    icon: Search,
  },
  {
    title: "Photo & PDF Attachments",
    description: "Attach images and PDF documents directly into entries with local storage.",
    icon: Paperclip,
  },
  {
    title: "Attachment Preview",
    description: "View photos and read PDFs directly inside the app with export support.",
    icon: Paperclip,
  },
  {
    title: "Light / Dark / System Theme",
    description: "Seamlessly adapts to your preferred theme and Android system settings.",
    icon: CheckCircle2,
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="px-4 sm:px-5 text-foreground pb-6">
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
              About Lectra
            </h1>
            <p className="text-xs text-muted-foreground">
              Application details & overview
            </p>
          </div>
        </header>

        {/* Branding Card */}
        <div className="mt-6 sm:mt-7">
          <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="flex flex-col items-center p-5 sm:p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-md shadow-primary/20 sm:h-20 sm:w-20">
                <img
                  src="/favicon.png"
                  alt="Lectra Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <h2 className="mt-3.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Lectra
              </h2>

              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  v1.0.0
                </span>
              </div>

              <p className="mt-2 text-xs sm:text-sm font-semibold text-primary">
                Capture Today. Recall Anytime.
              </p>

              <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Lectra is a personal daily capture and task management app that helps users save things they need to remember, organize tasks, set deadlines and reminders, and quickly access their information later.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Built for everyday use */}
        <div className="mt-6 sm:mt-7">
          <Card className="rounded-3xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                Built for everyday use
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Lectra reduces the need to remember everything manually by keeping your notes, daily capture, tasks, deadlines, and reminders all in one reliable, privacy-focused place. Everything stays on your device.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mt-6 sm:mt-7">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Feature Highlights
          </h3>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {features.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="overflow-hidden rounded-2xl border-border bg-card shadow-xs"
                >
                  <CardContent className="flex items-start gap-3 p-3.5 sm:p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
