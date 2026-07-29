"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { buttonTap, badgeVariants } from "@/lib/animations";

interface NotificationBellProps {
  onClick: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <motion.div whileTap={buttonTap}>
      <Button
        variant="ghost"
        onClick={onClick}
        className="relative h-12 w-12 rounded-2xl border border-border bg-card hover:bg-accent transition-all"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" strokeWidth={2.5} />

        <AnimatePresence>
          {mounted && unreadCount > 0 && (
            <motion.span
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="
            absolute
            -right-1
            -top-1
            flex
            h-6
            min-w-6
            items-center
            justify-center
            rounded-full
            bg-red-500
            text-xs
            font-bold
            text-white
          "
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
