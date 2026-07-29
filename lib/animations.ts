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
      duration: 0.3,
      staggerChildren: 0.08,
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
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
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
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.18,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: 0.15,
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
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/* ========================================================================
   LIST ANIMATIONS
   ------------------------------------------------------------------------
   Parent animation for staggered child animations.
   Used for:
   - Today's Entries
   - Pending Tasks
   - Notifications
   - Calendar Entries
   ======================================================================== */

export const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

/* ========================================================================
   BUTTON ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Buttons
   - Icon Buttons
   - FAB
   ======================================================================== */

export const buttonTap = {
  scale: 0.96,
};

/* ========================================================================
   BADGE ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Notification Badge
   - Task Count Badge
   - Status Chips
   ======================================================================== */

export const badgeVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

/* ========================================================================
   TOAST ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Success Toast
   - Error Toast
   - Info Toast
   ======================================================================== */

export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.18,
    },
  },
};

/* ========================================================================
   SHEET / PANEL ANIMATIONS
   ------------------------------------------------------------------------
   Used for:
   - Notification Panel
   - Future Side Sheets
   - Bottom Sheets
   ======================================================================== */

export const sheetVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.22,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.18,
    },
  },
};
