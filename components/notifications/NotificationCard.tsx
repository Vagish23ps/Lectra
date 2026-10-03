"use client";

import {
  Bell,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Clock,
  BarChart3,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import type { NotificationItem } from "@/store/notificationStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useEntryStore } from "@/store/entryStore";
import { getNotificationNativeId } from "@/src/notifications/ids";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface NotificationCardProps {
  notification: NotificationItem;
}

const typeConfig = {
  overdue: {
    icon: AlertTriangle,
    label: "Overdue",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    iconContainerClass: "bg-red-500/10 text-red-600 dark:text-red-400",
    borderClass: "border-red-500/30",
  },
  "deadline-today": {
    icon: Clock,
    label: "Due Today",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    iconContainerClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/30",
  },
  "deadline-tomorrow": {
    icon: Calendar,
    label: "Due Tomorrow",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconContainerClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/30",
  },
  "custom-reminder": {
    icon: Bell,
    label: "Reminder",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    iconContainerClass: "bg-primary/10 text-primary",
    borderClass: "border-primary/30",
  },
  "weekly-summary": {
    icon: BarChart3,
    label: "Weekly Summary",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    iconContainerClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-500/30",
  },
  "daily-reminder": {
    icon: Clock,
    label: "Reminder",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    iconContainerClass: "bg-primary/10 text-primary",
    borderClass: "border-primary/30",
  },
} as const;

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  const router = useRouter();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const entries = useEntryStore((state) => state.entries);

  const config =
    typeConfig[notification.type as keyof typeof typeConfig] ??
    typeConfig["custom-reminder"];
  const Icon = config.icon;

  // Find matching entry and work item if this is a task or custom reminder notification
  let targetEntryId: string | null = notification.entryId || null;
  let targetWorkId: string | null = notification.workId || null;

  if (!targetEntryId || !targetWorkId) {
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
            (w) => w.task && notification.body.includes(w.task),
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
  }

  // Find exact work item status if linked
  let targetWork: { id: string; task: string; completed?: boolean } | null =
    null;
  if (targetEntryId && targetWorkId) {
    const entry = entries.find((e) => e.id === targetEntryId);
    if (entry) {
      targetWork = entry.works.find((w) => w.id === targetWorkId) || null;
    }
  }

  const handleCardClick = () => {
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

  const handleCompleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetEntryId || !targetWorkId) return;

    const { entries, updateEntry } = useEntryStore.getState();
    const entry = entries.find((e) => e.id === targetEntryId);
    if (entry) {
      const updatedEntry = {
        ...entry,
        works: entry.works.map((w) =>
          w.id === targetWorkId ? { ...w, completed: true } : w,
        ),
      };
      updateEntry(updatedEntry);
      markAsRead(notification.id);
      useNotificationStore.getState().setActionTaken(notification.id, "completed");

      if (typeof window !== "undefined") {
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (Capacitor.isNativePlatform()) {
            const { LocalNotifications } = await import(
              "@capacitor/local-notifications"
            );
            const nativeId = getNotificationNativeId(notification.id);
            await LocalNotifications.removeDeliveredNotifications({
              notifications: [{ id: nativeId, title: "", body: "" }],
            }).catch(() => {});
          }
        } catch {
          // Ignore error on non-native environments
        }
      }

      toast.success("Task marked as completed");
    }
  };

  // Parse out body message and deadline if formatted with Deadline
  let mainBody = notification.body;
  let deadlineStr: string | null = null;

  const deadlineMatch = notification.body.match(
    /^(.*?)(?:\.?\s*Deadline:\s*([^]+))$/i,
  );
  if (deadlineMatch) {
    mainBody = deadlineMatch[1].trim();
    if (!mainBody.endsWith(".")) {
      mainBody += ".";
    }
    deadlineStr = deadlineMatch[2].trim();
  }

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{
        y: -2,
        scale: 1.005,
      }}
      className={`group cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all shadow-sm active:scale-[0.99] ${
        notification.read
          ? "border-border bg-card hover:border-primary/40"
          : `${config.borderClass} bg-card hover:border-primary/60 shadow-xs`
      }`}
    >
      {/* Header row: [Icon + Title + Unread dot] ... [Badge / Action + ChevronRight] */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconContainerClass}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-base font-semibold text-foreground">
                {notification.title}
              </h4>
              {!notification.read && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${config.badgeClass}`}
              >
                {config.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {targetWork && (
            <>
              {!targetWork.completed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCompleteTask}
                  className="h-7 rounded-lg px-2.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/10 active:scale-95"
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Complete
                </Button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Completed</span>
                </span>
              )}
            </>
          )}

          {notification.actionTaken === "stopped" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Stopped</span>
            </span>
          )}

          {targetEntryId && (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </div>

      {/* Body & Meta Hierarchy */}
      <div className="mt-3 space-y-2 pl-12">
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
