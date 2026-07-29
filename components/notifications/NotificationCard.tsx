"use client";

import { Bell, Calendar, CheckCircle2, Clock3, FileText, Sun, AlertTriangle } from "lucide-react";

import type { NotificationItem } from "@/store/notificationStore";

interface NotificationCardProps {
  notification: NotificationItem;
}

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  const iconMap = {
    "daily-reminder": FileText,
    "deadline-today": AlertTriangle,
    "deadline-tomorrow": Calendar,
    overdue: AlertTriangle,
    "weekly-summary": Bell,
  } as const;

  const Icon = iconMap[notification.type] ?? Bell;

  return (
    <div
      className={`
        flex items-start gap-4 rounded-xl border p-4 transition-all
        ${
          notification.read
            ? "bg-background"
            : "bg-blue-50 dark:bg-blue-950/30"
        }
      `}
    >
      <div className="mt-1">
        <Icon className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1">
        <h4 className="font-semibold">
          {notification.title}
        </h4>

        <p className="mt-1 text-sm text-muted-foreground">
          {notification.body}
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>

      {!notification.read && (
        <div className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
      )}
    </div>
  );
}