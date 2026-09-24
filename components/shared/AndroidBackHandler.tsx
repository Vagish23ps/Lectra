"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export default function AndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isHandling = false;

    const listener = App.addListener("backButton", async () => {
      if (isHandling) return;
      isHandling = true;

      try {
        // 1. Check if any active Radix Dialog / Modal is open
        const closeBtns = document.querySelectorAll<HTMLElement>(
          '[data-slot="dialog-close"], [role="dialog"] button[data-slot="dialog-close"], button[aria-label="Close"]'
        );

        if (closeBtns.length > 0) {
          const topCloseBtn = closeBtns[closeBtns.length - 1];
          topCloseBtn.click();
          return;
        }

        const openDialog = document.querySelector('[role="dialog"], [data-slot="dialog-content"], [data-slot="dialog-overlay"]');
        if (openDialog) {
          window.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Escape",
              code: "Escape",
              keyCode: 27,
              which: 27,
              bubbles: true,
              cancelable: true,
            })
          );
          return;
        }

        // 2. Navigation hierarchy:
        // Sub-settings pages -> Settings
        if (pathname && pathname.startsWith("/settings/") && pathname !== "/settings") {
          router.push("/settings");
          return;
        }

        // Secondary pages (Settings, Notifications, Calendar, Pending, Search, etc.) -> Home
        if (pathname && pathname !== "/") {
          router.push("/");
          return;
        }

        // 3. If already on Home with no dialog open, allow normal Android exit
        await App.exitApp();
      } finally {
        setTimeout(() => {
          isHandling = false;
        }, 300);
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [pathname, router]);

  return null;
}
