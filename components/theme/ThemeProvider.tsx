"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function ThemeProvider() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let isDark = true;

      if (theme === "dark") {
        isDark = true;
      } else if (theme === "light") {
        isDark = false;
      } else {
        // System
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }

      // Update meta theme-color
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      const targetColor = isDark ? "#080d1a" : "#f4f6fa";
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", targetColor);
      }

      // Native Capacitor status bar styling
      if (Capacitor.isNativePlatform()) {
        try {
          StatusBar.setStyle({
            style: isDark ? Style.Dark : Style.Light,
          }).catch(() => {});
          StatusBar.setBackgroundColor({
            color: targetColor,
          }).catch(() => {});
        } catch {
          // Ignore native errors if statusbar plugin is not ready
        }
      }
    };

    applyTheme();

    const handler = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  return null;
}
