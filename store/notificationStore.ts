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
            const exists = state.notifications.some(
              (n) => n.id === notification.id
            );
            if (exists) {
              return state;
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