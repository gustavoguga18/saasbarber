"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AdminRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-appointments-${Date.now()}`)
      .on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
  },
        (payload) => {
          console.log("🟢 INSERT recebido:", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log("🟡 UPDATE recebido:", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log("🔴 DELETE recebido:", payload);
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
