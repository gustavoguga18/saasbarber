"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AdminRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log(
            "🔔 Realtime: alteração em appointments",
            payload
          );

          router.refresh();
        }
      )
      .subscribe((status, err) => {
  console.log("📡 Realtime status:", status);
  console.log("📡 Realtime error:", err);
});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
