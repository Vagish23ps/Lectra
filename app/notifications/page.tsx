"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Trash2,
  Bell,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCard from "@/components/notifications/NotificationCard";
import ActiveReminderCard from "@/components/reminders/ActiveReminderCard";
import ReminderDetailModal from "@/components/reminders/ReminderDetailModal";
import SnoozeModal from "@/components/reminders/SnoozeModal";
import { useNotificationStore } from "@/store/notificationStore";
import { useActiveReminders, ActiveReminderItem } from "@/hooks/useActiveReminders";
import { useEntryStore } from "@/store/entryStore";
import { CustomReminder } from "@/types/reminder";
import { motion, AnimatePresence } from "framer-motion";
import { listVariants, itemVariants, tabContentVariants } from "@/lib/animations";
import { toast } from "sonner";
import { format } from "date-fns";

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: "notifications" | "reminders" =
    tabParam === "reminders" || tabParam === "notifications"
      ? tabParam
      : "notifications";

  const [selectedReminderItem, setSelectedReminderItem] = useState<ActiveReminderItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [snoozeModalItem, setSnoozeModalItem] = useState<ActiveReminderItem | null>(null);
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount());
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearReadNotifications = useNotificationStore(
    (state) => state.clearReadNotifications,
  );

  const {
    activeReminders,
    pausedReminders,
    allReminders,
    totalActiveCount,
  } = useActiveReminders();

  useEffect(() => {
    const snoozeReminderId = searchParams.get("snoozeReminderId");
    const entryId = searchParams.get("entryId");
    const workId = searchParams.get("workId");

    if (snoozeReminderId || entryId) {
      const match = allReminders.find((item) => {
        if (snoozeReminderId && item.reminder.id === snoozeReminderId) return true;
        if (entryId && item.entryId === entryId) {
          if (workId) return item.workId === workId;
          return !item.workId;
        }
        return false;
      });

      if (match) {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/notifications?tab=reminders");
        }
        const timer = setTimeout(() => {
          setSnoozeModalItem(match);
          setSnoozeModalOpen(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, allReminders]);

  const updateReminder = useEntryStore((state) => state.updateReminder);

  const handleTabChange = (tab: "notifications" | "reminders") => {
    router.replace(`/notifications?tab=${tab}`);
  };

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTabTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTabTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Trigger only when the gesture is a clear horizontal swipe within 500ms
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsed < 500) {
      if (deltaX < 0 && activeTab === "notifications") {
        // Swipe left -> switch to Reminders
        handleTabChange("reminders");
      } else if (deltaX > 0 && activeTab === "reminders") {
        // Swipe right -> switch to Notifications
        handleTabChange("notifications");
      }
    }
  };

  const handleTogglePause = (item: ActiveReminderItem) => {
    const nextEnabled = !item.reminder.enabled;
    const updated: CustomReminder = {
      ...item.reminder,
      enabled: nextEnabled,
    };
    updateReminder(item.entryId, item.workId || null, updated);
    toast.success(nextEnabled ? "Reminder resumed" : "Reminder paused");
  };

  const handleOpenDetails = (item: ActiveReminderItem) => {
    setSelectedReminderItem(item);
    setDetailModalOpen(true);
  };

  const handleOpenSnooze = (item: ActiveReminderItem) => {
    setSnoozeModalItem(item);
    setSnoozeModalOpen(true);
  };

  const handleApplySnooze = (date: Date) => {
    if (!snoozeModalItem) return;
    const updated: CustomReminder = {
      ...snoozeModalItem.reminder,
      snoozedUntil: date.toISOString(),
    };
    updateReminder(snoozeModalItem.entryId, snoozeModalItem.workId || null, updated);
    toast.success(`Reminder snoozed until ${format(date, "d MMM, hh:mm a")}`);
  };

  const handleClearSnooze = () => {
    if (!snoozeModalItem) return;
    const updated: CustomReminder = {
      ...snoozeModalItem.reminder,
      snoozedUntil: undefined,
    };
    updateReminder(snoozeModalItem.entryId, snoozeModalItem.workId || null, updated);
    toast.success("Snooze cleared.");
  };

  const handleGoToEntry = (item: ActiveReminderItem) => {
    const workQuery = item.workId ? `&workId=${item.workId}` : "";
    router.push(`/?viewEntry=${item.entryId}${workQuery}`);
  };

  const handleClearRead = async () => {
    clearReadNotifications();
    if (typeof window !== "undefined") {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          await LocalNotifications.removeAllDeliveredNotifications();
        }
      } catch (err) {
        console.warn("Failed to clear native delivered notifications:", err);
      }
    }
    toast.success("Read notifications cleared.");
  };

  return (
    <main className="px-4 sm:px-5 text-foreground pb-12">
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
                  {activeTab === "notifications" ? "Notifications" : "Reminders"}
                </h1>
                {activeTab === "notifications" && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
                {activeTab === "reminders" && totalActiveCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                    {totalActiveCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {activeTab === "notifications"
                  ? "Recent alerts and triggered events"
                  : "Scheduled and active check-ins"}
              </p>
            </div>
          </div>

          {/* Action Buttons for Tab 1 (Notifications) */}
          {activeTab === "notifications" && (
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
                  onClick={handleClearRead}
                  className="h-8 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Clear read
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tabs & Content Container with Horizontal Swipe Support */}
        <div
          onTouchStart={handleTabTouchStart}
          onTouchEnd={handleTabTouchEnd}
          className="touch-pan-y"
        >
          {/* Tab Navigation (Matching Pending List Visual Style) */}
          <div className="mt-4 flex rounded-2xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => handleTabChange("notifications")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "notifications"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("reminders")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "reminders"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Reminders</span>
              {totalActiveCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                  {totalActiveCount}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "notifications" ? (
              <motion.div
                key="notifications"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-5 sm:mt-6"
              >
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 py-12 sm:py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bell className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3.5 text-sm sm:text-base font-semibold text-foreground">
                      No notifications.
                    </h3>
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
              </motion.div>
            ) : (
              <motion.div
                key="reminders"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-5 sm:mt-6 space-y-6"
              >
                {allReminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 py-12 sm:py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Clock className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3.5 text-sm sm:text-base font-semibold text-foreground">
                      No reminders.
                    </h3>
                  </div>
                ) : (
                  <>
                    {/* Active Reminders Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Active ({activeReminders.length})
                        </h3>
                      </div>

                      {activeReminders.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          No active reminders right now.
                        </div>
                      ) : (
                        <motion.div className="space-y-3" variants={listVariants}>
                          <AnimatePresence mode="popLayout">
                            {activeReminders.map((item) => (
                              <motion.div
                                key={item.reminder.id}
                                layout
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                              >
                                <ActiveReminderCard
                                  item={item}
                                  onTogglePause={() => handleTogglePause(item)}
                                  onViewDetails={() => handleOpenDetails(item)}
                                  onGoToEntry={() => handleGoToEntry(item)}
                                  onSnooze={() => handleOpenSnooze(item)}
                                  onEdit={() => handleOpenDetails(item)}
                                  onDelete={() => {
                                    updateReminder(item.entryId, item.workId || null, undefined);
                                    toast.success("Reminder deleted");
                                  }}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </div>

                    {/* Paused Reminders Section */}
                    {pausedReminders.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Paused ({pausedReminders.length})
                          </h3>
                        </div>

                        <motion.div className="space-y-3" variants={listVariants}>
                          <AnimatePresence mode="popLayout">
                            {pausedReminders.map((item) => (
                              <motion.div
                                key={item.reminder.id}
                                layout
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                              >
                                <ActiveReminderCard
                                  item={item}
                                  onTogglePause={() => handleTogglePause(item)}
                                  onViewDetails={() => handleOpenDetails(item)}
                                  onGoToEntry={() => handleGoToEntry(item)}
                                  onSnooze={() => handleOpenSnooze(item)}
                                  onEdit={() => handleOpenDetails(item)}
                                  onDelete={() => {
                                    updateReminder(item.entryId, item.workId || null, undefined);
                                    toast.success("Reminder deleted");
                                  }}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reminder Details Modal */}
      <ReminderDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        item={selectedReminderItem}
      />

      {/* Snooze Sub-Modal */}
      {snoozeModalItem && (
        <SnoozeModal
          open={snoozeModalOpen}
          onOpenChange={setSnoozeModalOpen}
          isCurrentlySnoozed={snoozeModalItem.isSnoozed}
          onSnooze={handleApplySnooze}
          onClearSnooze={handleClearSnooze}
        />
      )}
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsContent />
    </Suspense>
  );
}
