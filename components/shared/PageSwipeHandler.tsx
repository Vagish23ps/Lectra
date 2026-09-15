"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const MAIN_PAGES = ["/", "/calendar", "/pending", "/search"];

export default function PageSwipeHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartRef = useRef<{ x: number; y: number; time: number; valid: boolean } | null>(null);

  useEffect(() => {
    if (!MAIN_PAGES.includes(pathname)) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore touches inside modals, dialogs, drawers, dropdowns
      if (
        target.closest('[role="dialog"]') ||
        target.closest('[data-slot="dialog-content"]') ||
        target.closest('[data-state="open"]') ||
        document.body.getAttribute("data-scroll-locked") === "1"
      ) {
        touchStartRef.current = null;
        return;
      }

      // Ignore touches inside inputs, textareas, selects, buttons, contenteditable
      if (
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("button") ||
        target.closest("a") ||
        target.isContentEditable
      ) {
        touchStartRef.current = null;
        return;
      }

      // Ignore touches inside calendar month grid or any element with no-page-swipe
      if (
        target.closest('[data-slot="calendar"]') ||
        target.closest(".rdp") ||
        target.closest(".no-page-swipe")
      ) {
        touchStartRef.current = null;
        return;
      }

      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
        valid: true,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.valid) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartRef.current.x;
      const deltaY = currentY - touchStartRef.current.y;

      // If vertical movement exceeds horizontal movement, user is scrolling vertically
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 15) {
        touchStartRef.current.valid = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.valid) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      if (Math.abs(deltaX) >= 75 && Math.abs(deltaX) >= Math.abs(deltaY) * 2 && elapsed <= 450) {
        const currentIndex = MAIN_PAGES.indexOf(pathname);
        if (currentIndex === -1) return;

        if (deltaX < 0 && currentIndex < MAIN_PAGES.length - 1) {
          router.push(MAIN_PAGES[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) {
          router.push(MAIN_PAGES[currentIndex - 1]);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pathname, router]);

  return null;
}
