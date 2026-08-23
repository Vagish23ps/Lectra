"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCheck, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCard from "@/components/notifications/NotificationCard";
import { useNotificationStore } from "@/store/notificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, listVariants, itemVariants } from "@/lib/animations";

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount());
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearReadNotifications = useNotificationStore(
    (state) => state.clearReadNotifications,
  );

  return (
    <main className="px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4 sm:pb-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/")}
              className="h-10 w-10 shrink-0 rounded-xl"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Review task alerts and scheduled check-ins
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 rounded-xl text-xs font-medium"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}

            {notifications.some((n) => n.read) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearReadNotifications}
                className="h-8 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="mt-5 sm:mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 py-12 sm:py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="mt-3.5 text-sm sm:text-base font-semibold text-foreground">
                No notifications yet
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                You&apos;re all caught up! New reminders will appear here.
              </p>
            </div>
          ) : (
            <motion.div className="space-y-3 sm:space-y-4" variants={listVariants}>
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <NotificationCard notification={notification} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
