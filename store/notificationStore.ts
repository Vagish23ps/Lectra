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
}

interface NotificationStore {
  notifications: NotificationItem[];

  addNotification: (
    notification: NotificationItem
  ) => void;

  removeNotification: (id: string) => void;

  markAsRead: (id: string) => void;

  markAllAsRead: () => void;

  clearReadNotifications: () => void;

  clearAllNotifications: () => void;

  unreadCount: () => number;
}

export const useNotificationStore =
  create<NotificationStore>()(
    persist(
      (set, get) => ({
        notifications: [],

        addNotification: (notification) =>
          set((state) => {
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

              // Update existing notification with new body / title / type / id / read status
              const updated = [...state.notifications];
              updated[existingIndex] = {
                ...existing,
                ...notification,
                id: notification.id,
              };
              return {
                notifications: updated,
              };
            }

            return {
              notifications: [
                notification,
                ...state.notifications,
              ],
            };
          }),

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter(
              (notification) => notification.id !== id
            ),
          })),

        markAsRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map(
              (notification) =>
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
            notifications: state.notifications.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            ),
          })),

        clearReadNotifications: () =>
          set((state) => ({
            notifications: state.notifications.filter(
              (notification) => !notification.read
            ),
          })),

        clearAllNotifications: () =>
          set({
            notifications: [],
          }),

        unreadCount: () =>
          get().notifications.filter(
            (notification) => !notification.read
          ).length,
      }),
      {
        name: "lectra-notification-history",
      }
    )
  );