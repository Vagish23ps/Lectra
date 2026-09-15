import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/shared/BottomNav";
import NotificationProvider from "@/src/notifications/provider";
import AndroidBackHandler from "@/components/shared/AndroidBackHandler";
import PageSwipeHandler from "@/components/shared/PageSwipeHandler";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { Sonner } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080d1a",
};

export const metadata: Metadata = {
  title: "Lectra",
  description: "Capture Today. Recall Anytime.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider />
        <NotificationProvider />
        <AndroidBackHandler />
        <PageSwipeHandler />

        <div className="flex-1 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>

        <Sonner />

        <BottomNav />
      </body>
    </html>
  );
}
