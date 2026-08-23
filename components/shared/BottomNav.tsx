"use client";

import { Home, CalendarDays, ClipboardList, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buttonTap } from "@/lib/animations";

const navItems = [
  {
    label: "Home",
    icon: Home,
    path: "/",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    path: "/calendar",
  },
  {
    label: "Pending List",
    icon: ClipboardList,
    path: "/pending",
  },
  {
    label: "Search",
    icon: Search,
    path: "/search",
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <motion.button
              key={item.path}
              whileTap={buttonTap}
              type="button"
              onClick={() => router.push(item.path)}
              className={`group relative flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon Container */}
              <motion.div
                animate={{
                  scale: active ? 1.05 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "group-hover:bg-secondary"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </motion.div>

              {/* Active Indicator */}
              <div className="my-0.5 flex h-1 w-full items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="active-indicator"
                    className="h-1 w-4 rounded-full bg-primary"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 30,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium leading-tight transition-colors ${
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
