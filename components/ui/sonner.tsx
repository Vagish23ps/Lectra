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
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-border bg-card text-card-foreground shadow-lg",
          title: "font-semibold",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}