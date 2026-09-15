import { Variants } from "framer-motion";

/* ========================================================================
   PAGE ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Dashboard
   - Pending Page
   - Calendar
   - Settings
   - Notification Settings
   ======================================================================== */

export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      staggerChildren: 0.05,
    },
  },
};

/* ========================================================================
   SECTION / ITEM ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Sections
   - Cards
   - Headers
   - List Items
   - Dashboard Blocks
   ======================================================================== */

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -6,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/* ========================================================================
   DIALOG ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Add Entry
   - Edit Entry
   - View Entry
   - Confirmation Dialogs
   ======================================================================== */

export const dialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.18,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: 0.14,
    },
  },
};

/* ========================================================================
   CARD ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Entry Cards
   - Pending Task Cards
   - Notification Cards
   - Calendar Cards
   ======================================================================== */

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -6,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/* ========================================================================
   TAB CONTENT ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Pending List (Important vs Other)
   - Notifications (Notifications vs Reminders)
   ======================================================================== */

export const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.12,
    },
  },
};

/* ========================================================================
   LIST ANIMATIONS
   ------------------------------------------------------------------------
   Parent animation for staggered child animations.
   ======================================================================== */

export const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

/* ========================================================================
   BUTTON ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Buttons
   - Icon Buttons
   ======================================================================== */

export const buttonTap = {
  scale: 0.97,
  transition: {
    duration: 0.1,
  },
};

/* ========================================================================
   BADGE ANIMATIONS
   ------------------------------------------------------------------------
   ======================================================================== */

export const badgeVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.18,
    },
  },
};

/* ========================================================================
   TOAST ANIMATIONS
   ------------------------------------------------------------------------
   ======================================================================== */

export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.14,
    },
  },
};

/* ========================================================================
   SHEET / PANEL ANIMATIONS
   ------------------------------------------------------------------------
   ======================================================================== */

export const sheetVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: {
      duration: 0.15,
    },
  },
};

// Reduced motion support
export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Variants that respect reduced motion (opacity only, no transforms)
export const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

export const reducedCardVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Helper: pick variants based on reduced motion preference
export function pickVariants(standard: Variants, reduced: Variants, prefersReduced: boolean): Variants {
  return prefersReduced ? reduced : standard;
}
