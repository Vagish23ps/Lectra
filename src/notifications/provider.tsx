"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEntryStore } from "@/store/entryStore";
import { useNotificationSettingsStore } from "@/store/notificationSettingsStore";
import { notificationService } from "./service";
import { createNotificationChannels } from "./channel";
import { initializeCapacitorNotificationActions } from "./capacitor";
import { registerAppNavigation } from "./actions";

export default function NotificationProvider() {
  const router = useRouter();
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);
  const settings = useNotificationSettingsStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    registerAppNavigation((url: string) => router.push(url));
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;

    async function setupNotifications() {
      if (!isInitialized.current) {
        isInitialized.current = true;
        await createNotificationChannels();
        await initializeCapacitorNotificationActions();
        await notificationService.initialize(entries);
      } else {
        await notificationService.refresh(entries);
      }
    }

    void setupNotifications();
  }, [hydrated, entries, settings]);

  return null;
}
