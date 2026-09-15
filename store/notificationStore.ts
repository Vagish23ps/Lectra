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
}

interface NotificationStore {
  notifications: NotificationItem[];
  clearedIds: string[];

  addNotification: (notification: NotificationItem) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearReadNotifications: () => void;
  clearAllNotifications: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      clearedIds: [],

      addNotification: (notification) =>
        set((state) => {
          // If this notification was explicitly cleared by the user, do not resurrect it
          if (state.clearedIds && state.clearedIds.includes(notification.id)) {
            return state;
          }

          const existingIndex = state.notifications.findIndex(
            (n) =>
              n.id === notification.id ||
              (n.title === notification.title &&
                n.body.replace(/\. Deadline:.*$/, "") ===
                  notification.body.replace(/\. Deadline:.*$/, ""))
          );

          if (existingIndex !== -1) {
            const existing = state.notifications[existingIndex];
            // Exact duplicate (same id, title, body, read, and type)
            if (
              existing.id === notification.id &&
              existing.title === notification.title &&
              existing.body === notification.body &&
              existing.read === notification.read &&
              existing.type === notification.type
            ) {
              return state;
            }

            // Update existing notification with latest details while preserving read status if already read
            const updated = [...state.notifications];
            updated[existingIndex] = {
              ...existing,
              ...notification,
              id: notification.id,
              read: existing.read || notification.read,
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

      unreadCount: () =>
        get().notifications.filter((notification) => !notification.read).length,
    }),
    {
      name: "lectra-notification-history",
    }
  )
);