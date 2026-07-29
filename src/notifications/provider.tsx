"use client";

import { useEffect } from "react";
import { notificationWorker } from "./worker";
import { requestNotificationPermission } from "./permission";
import { createNotificationChannels } from "./channel";

export default function NotificationProvider() {
  useEffect(() => {
    async function initializeNotifications() {
      await requestNotificationPermission();
      await createNotificationChannels();

      notificationWorker.start();
    }

    initializeNotifications();

    return () => {
      notificationWorker.stop();
    };
  }, []);

  return null;
}