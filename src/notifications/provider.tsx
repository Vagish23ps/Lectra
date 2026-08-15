"use client";

import { useEffect, useRef } from "react";
import { useEntryStore } from "@/store/entryStore";
import { notificationService } from "./service";
import { createNotificationChannels } from "./channel";
import { initializeCapacitorNotificationActions } from "./capacitor";
import { debugNotificationState } from "./capacitor";

export default function NotificationProvider() {
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!hydrated) return;

    async function setupNotifications() {
      if (!isInitialized.current) {
        isInitialized.current = true;
        await createNotificationChannels();
        await initializeCapacitorNotificationActions();
        await notificationService.initialize(entries);
        setTimeout(() => {
          void debugNotificationState();
        }, 10_000);
      } else {
        await notificationService.refresh(entries);
      }
    }

    void setupNotifications();
  }, [hydrated, entries]);

  return null;
}
