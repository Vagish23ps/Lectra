"use client";

import { useEffect } from "react";
import { useEntryStore } from "@/store/entryStore";
import { notificationService } from "./service";
import { createNotificationChannels } from "./channel";
import { initializeCapacitorNotificationActions } from "./capacitor";
import { debugNotificationState } from "./capacitor";

export default function NotificationProvider() {
  console.log("🚨 LECTRA PROVIDER MOUNTED");
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);

  useEffect(() => {
    console.log(
      "🚨 LECTRA PROVIDER EFFECT => hydrated:",
      hydrated,
      "entries:",
      entries.length,
    );

    if (!hydrated) return;

    async function initializeNotifications() {
      console.log("🚨 LECTRA INITIALIZING");

      await createNotificationChannels();
      await initializeCapacitorNotificationActions();
      await notificationService.initialize(entries);
      setTimeout(() => {
        void debugNotificationState();
      }, 10_000);
    }

    void initializeNotifications();
  }, [hydrated, entries]);
  return null;
}
