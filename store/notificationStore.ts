import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NotificationType } from "@/src/notifications/notificationTypes";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  entryId?: string;
  workId?: string;
  actionTaken?: "completed" | "reminded" | "stopped";
}

interface NotificationStore {
  notifications: NotificationItem[];
  clearedIds: string[];
  hydrated: boolean;

  setHydrated: (value: boolean) => void;
  addNotification: (notification: NotificationItem) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearReadNotifications: () => void;
  clearAllNotifications: () => void;
  setActionTaken: (id: string, action: "completed" | "reminded" | "stopped") => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      clearedIds: [],
      hydrated: false,

      setHydrated: (value) => {
        set({ hydrated: value });
      },

      addNotification: (notification) =>
        set((state) => {
          // If this notification was explicitly cleared by the user, do not resurrect it
          if (state.clearedIds && state.clearedIds.includes(notification.id)) {
            return state;
          }

          const existingIndex = state.notifications.findIndex(
            (n) => n.id === notification.id
          );

          if (existingIndex !== -1) {
            const existing = state.notifications[existingIndex];
            // If already identical, return untouched state
            if (
              existing.id === notification.id &&
              existing.read === (existing.read || notification.read) &&
              existing.title === notification.title &&
              existing.body === notification.body &&
              existing.entryId === (notification.entryId ?? existing.entryId) &&
              existing.workId === (notification.workId ?? existing.workId) &&
              existing.type === notification.type &&
              existing.actionTaken === (notification.actionTaken ?? existing.actionTaken)
            ) {
              return state;
            }

            // Update existing notification with latest details while preserving read status and metadata
            const updated = [...state.notifications];
            updated[existingIndex] = {
              ...existing,
              ...notification,
              id: notification.id,
              read: existing.read || notification.read,
              entryId: notification.entryId ?? existing.entryId,
              workId: notification.workId ?? existing.workId,
              actionTaken: notification.actionTaken ?? existing.actionTaken,
            };
            return {
              notifications: updated,
            };
          }

          return {
            notifications: [notification, ...state.notifications],
          };
        }),

      removeNotification: (id) =>
        set((state) => ({
          clearedIds: Array.from(new Set([...(state.clearedIds || []), id])).slice(-300),
          notifications: state.notifications.filter(
            (notification) => notification.id !== id
          ),
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  read: true,
                }
              : notification
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        })),

      clearReadNotifications: () =>
        set((state) => {
          const readIds = state.notifications
            .filter((n) => n.read)
            .map((n) => n.id);
          return {
            clearedIds: Array.from(new Set([...(state.clearedIds || []), ...readIds])).slice(-300),
            notifications: state.notifications.filter(
              (notification) => !notification.read
            ),
          };
        }),

      clearAllNotifications: () =>
        set((state) => {
          const allIds = state.notifications.map((n) => n.id);
          return {
            clearedIds: Array.from(new Set([...(state.clearedIds || []), ...allIds])).slice(-300),
            notifications: [],
          };
        }),

      setActionTaken: (id, action) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  read: true,
                  actionTaken: action,
                }
              : notification
          ),
        })),

      unreadCount: () =>
        get().notifications.filter((notification) => !notification.read).length,
    }),
    {
      name: "lectra-notification-history",
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHydrated(true);
        };
      },
    }
  )
);