"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { buttonTap, badgeVariants } from "@/lib/animations";

interface NotificationBellProps {
  onClick?: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const router = useRouter();
  const unreadCount = useNotificationStore((state) => state.unreadCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/notifications");
    }
  };

  return (
    <motion.div whileTap={buttonTap}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary active:scale-95"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />

        <AnimatePresence>
          {mounted && unreadCount > 0 && (
            <motion.span
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
