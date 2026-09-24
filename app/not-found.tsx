"use client";

import Link from "next/link";
import { Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 sm:px-5 text-foreground">
      <div className="mx-auto w-full max-w-md text-center">
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="flex flex-col items-center p-6 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileQuestion className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Page Not Found
            </h1>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              The page you are looking for doesn&apos;t exist or has been moved.
            </p>

            <div className="mt-6 w-full">
              <Button asChild className="h-11 w-full rounded-2xl font-semibold gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Return to Dashboard</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
