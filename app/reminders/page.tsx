"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RemindersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/notifications?tab=reminders");
  }, [router]);

  return null;
}
