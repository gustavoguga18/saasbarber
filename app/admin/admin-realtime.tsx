"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AdminRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // =========================
    // REALTIME - AGENDAMENTOS
    // =========================

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
          console.log("🔔 REALTIME RECEBIDO:", payload);

          router.refresh();
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Realtime status:", status);
        console.log("📡 Realtime error:", err);
      });

    // =========================
    // ATUALIZAÇÃO AUTOMÁTICA
    // =========================
    //
    // Mesmo que não exista nenhuma alteração
    // no banco, atualiza o dashboard a cada
    // 30 segundos para recalcular o próximo
    // atendimento com base no horário atual.

    const interval = setInterval(() => {
      console.log("⏰ Atualizando dashboard automaticamente...");

      router.refresh();
    }, 30_000);

    // =========================
    // LIMPEZA
    // =========================

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
