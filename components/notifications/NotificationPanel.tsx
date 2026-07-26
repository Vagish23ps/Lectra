"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import NotificationCard from "./NotificationCard";
import { useNotificationStore } from "@/store/notificationStore";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({
  open,
  onClose,
}: NotificationPanelProps) {
  const notifications = useNotificationStore(
    (state) => state.notifications
  );

  const markAllAsRead = useNotificationStore(
    (state) => state.markAllAsRead
  );

  const clearReadNotifications = useNotificationStore(
    (state) => state.clearReadNotifications
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            Notifications
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-b p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearReadNotifications}
          >
            Clear read
          </Button>
        </div>

        {/* Notifications */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No notifications 🎉
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}