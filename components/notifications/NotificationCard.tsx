"use client";

import { Bell, Calendar, CheckCircle2, Clock3, FileText, Sun, AlertTriangle } from "lucide-react";

import { NotificationItem } from "@/types/notification";

interface NotificationCardProps {
  notification: NotificationItem;
}

const iconMap = {
  deadline: AlertTriangle,
  upcoming: Calendar,
  "daily-note": FileText,
  morning: Sun,
  evening: Clock3,
  completed: CheckCircle2,
  overdue: AlertTriangle,
  system: Bell,
};

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  const Icon = iconMap[notification.type];

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
          {notification.message}
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