"use client";

import { Toaster } from "sonner";

export function Sonner() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      duration={3000}
      offset="calc(env(safe-area-inset-top, 0px) + 1rem)"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-border bg-card text-card-foreground shadow-lg max-w-[calc(100vw-2rem)]",
          title: "font-semibold break-words",
          description: "text-muted-foreground break-words text-xs",
        },
        style: {
          marginTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          maxWidth: "calc(100vw - 2rem)",
        },
      }}
    />
  );
}