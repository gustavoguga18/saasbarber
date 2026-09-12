"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AgendaActions({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(
    status: "confirmed" | "cancelled"
  ) {
    const message =
      status === "confirmed"
        ? "Confirmar este agendamento?"
        : "Cancelar este agendamento?";

    if (!window.confirm(message)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/appointments",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: appointmentId,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível atualizar o agendamento."
        );
        return;
      }

      router.refresh();
    } catch {
      alert(
        "Não foi possível atualizar o agendamento."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-actions">
      <button
        type="button"
        className="admin-action-confirm"
        onClick={() => updateStatus("confirmed")}
        disabled={loading}
      >
        {loading ? "..." : "Confirmar"}
      </button>

      <button
        type="button"
        className="admin-action-cancel"
        onClick={() => updateStatus("cancelled")}
        disabled={loading}
      >
        Cancelar
      </button>
    </div>
  );
}
