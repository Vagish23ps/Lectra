"use client";

import { Bell, Calendar, FileText, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import type { NotificationItem } from "@/store/notificationStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useEntryStore } from "@/store/entryStore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface NotificationCardProps {
  notification: NotificationItem;
}

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  const router = useRouter();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const entries = useEntryStore((state) => state.entries);

  const iconMap = {
    "daily-reminder": FileText,
    "deadline-today": AlertTriangle,
    "deadline-tomorrow": Calendar,
    overdue: AlertTriangle,
    "weekly-summary": Bell,
    "custom-reminder": Bell,
  } as const;

  const Icon = iconMap[notification.type] ?? Bell;

  // Find matching entry and work item if this is a task or custom reminder notification
  let targetEntryId: string | null = null;
  let targetWorkId: string | null = null;

  if (notification.type === "custom-reminder") {
    if (notification.id.startsWith("custom-task")) {
      const rawWorkId = notification.id
        .replace(/^custom-task(-daily|-weekly|-day|-monthly)?-/, "")
        .split("-")[0];

      for (const entry of entries) {
        const work = entry.works.find((w) => w.id === rawWorkId);
        if (work) {
          targetEntryId = entry.id;
          targetWorkId = work.id;
          break;
        }
      }
    } else if (notification.id.startsWith("custom-entry")) {
      const rawEntryId = notification.id
        .replace(/^custom-entry(-daily|-weekly|-day|-monthly)?-/, "")
        .split("-")[0];

      const entry = entries.find((e) => e.id === rawEntryId);
      if (entry) {
        targetEntryId = entry.id;
      }
    }

    if (!targetEntryId && entries.length > 0) {
      for (const entry of entries) {
        if (
          (entry.entryName && notification.body.includes(entry.entryName)) ||
          (entry.subject && notification.body.includes(entry.subject))
        ) {
          targetEntryId = entry.id;
          break;
        }
        const matchingWork = entry.works.find(
          (w) => w.task && notification.body.includes(w.task)
        );
        if (matchingWork) {
          targetEntryId = entry.id;
          targetWorkId = matchingWork.id;
          break;
        }
      }
    }
  } else if (
    notification.type === "overdue" ||
    notification.type === "deadline-today" ||
    notification.type === "deadline-tomorrow"
  ) {
    const rawWorkId = notification.id.replace(
      /^(overdue|deadline-today|deadline-tomorrow)-/,
      "",
    );

    for (const entry of entries) {
      const work = entry.works.find((w) => w.id === rawWorkId);
      if (work) {
        targetEntryId = entry.id;
        targetWorkId = work.id;
        break;
      }
    }

    if (!targetEntryId && entries.length > 0) {
      // Check if task name in notification.body matches any entry work
      for (const entry of entries) {
        const matchingWork = entry.works.find(
          (w) => w.task && notification.body.includes(`"${w.task}"`),
        );
        if (matchingWork) {
          targetEntryId = entry.id;
          targetWorkId = matchingWork.id;
          break;
        }
      }
    }
  }

  const handleView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (targetEntryId) {
      const workQuery = targetWorkId ? `&workId=${targetWorkId}` : "";
      router.push(`/?viewEntry=${targetEntryId}${workQuery}`);
    } else {
      router.push("/");
    }
  };

  // Parse out body message and deadline if formatted with Deadline
  let mainBody = notification.body;
  let deadlineStr: string | null = null;

  const deadlineMatch = notification.body.match(/^(.*?)(?:\.?\s*Deadline:\s*([^]+))$/i);
  if (deadlineMatch) {
    mainBody = deadlineMatch[1].trim();
    if (!mainBody.endsWith(".")) {
      mainBody += ".";
    }
    deadlineStr = deadlineMatch[2].trim();
  }

  return (
    <motion.div
      onClick={() => {
        if (!notification.read) {
          markAsRead(notification.id);
        }
      }}
      whileHover={{
        y: -2,
        scale: 1.005,
      }}
      className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
        notification.read
          ? "border-border bg-card hover:border-primary/40"
          : "border-primary/40 bg-primary/5 hover:border-primary/60 shadow-primary/5"
      }`}
    >
      {/* Header row: [Icon] [Title + Unread dot] ... [View ↗] */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h4 className="truncate text-base font-semibold text-foreground">
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
        </div>

        {targetEntryId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="h-8 shrink-0 gap-1 rounded-xl border-border px-2.5 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <span>View</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Body & Meta Hierarchy */}
      <div className="mt-3.5 space-y-2.5 pl-12">
        <p className="break-words text-sm leading-relaxed text-foreground/90">
          {mainBody}
        </p>

        {deadlineStr && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Deadline: {deadlineStr}</span>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          {format(new Date(notification.createdAt), "dd MMM yyyy • hh:mm a")}
        </p>
      </div>
    </motion.div>
  );
}
