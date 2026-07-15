"use client";

import {
  Home,
  CalendarDays,
  ClipboardList,
  Search,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

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
    label: "Pending",
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-4xl items-center justify-around px-3 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active = pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                router.push(item.path)
              }
              className={`group relative flex min-w-16 flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
              aria-current={
                active ? "page" : undefined
              }
            >
              {/* Active Indicator */}

              {active && (
                <span className="absolute -top-2 h-1 w-8 rounded-full bg-primary" />
              )}

              {/* Icon */}

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "group-hover:bg-secondary"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Label */}

              <span>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}