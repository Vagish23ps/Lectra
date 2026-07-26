import { create } from "zustand";

import { NotificationItem } from "@/types/notification";
import { generateNotifications } from "@/lib/notificationGenerator";
import { useEntryStore } from "@/store/entryStore";

interface NotificationStore {
  notifications: NotificationItem[];

  addNotification: (notification: NotificationItem) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearReadNotifications: () => void;
  refreshNotifications: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read: true,
      })),
    })),

  clearReadNotifications: () =>
    set((state) => ({
      notifications: state.notifications.filter((n) => !n.read),
    })),

  refreshNotifications: () => {
    const entries = useEntryStore.getState().entries;

    set({
      notifications: generateNotifications(entries),
    });
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));