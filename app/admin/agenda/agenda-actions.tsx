"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AgendaActionsProps = {
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  appointmentDate: string;
  startTime: string;
  price: number;
};

export function AgendaActions({
  appointmentId,
  customerName,
  customerPhone,
  serviceName,
  appointmentDate,
  startTime,
  price,
}: AgendaActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function openWhatsApp(
    status: "confirmed" | "cancelled"
  ) {
    const phone = customerPhone.replace(/\D/g, "");

    if (!phone) {
      alert(
        "Este cliente não possui um número de WhatsApp válido."
      );
      return;
    }

    const [year, month, day] = appointmentDate.split("-");

    const formattedDate =
      year && month && day
        ? `${day}/${month}/${year}`
        : appointmentDate;

    const formattedTime = startTime
      ? startTime.slice(0, 5)
      : "";

    const formattedPrice = price
      .toFixed(2)
      .replace(".", ",");

    const message =
      status === "confirmed"
        ? `Olá, ${customerName}! 💈

Seu agendamento na Yago Barbershop foi confirmado! ✅

📅 Data: ${formattedDate}
🕐 Horário: ${formattedTime}
✂️ Serviço: ${serviceName}
💰 Valor: R$ ${formattedPrice}

Te esperamos! 💈✂️`
        : `Olá, ${customerName}!

Seu agendamento na Yago Barbershop foi cancelado. ❌

📅 Data: ${formattedDate}
🕐 Horário: ${formattedTime}
✂️ Serviço: ${serviceName}

Caso queira, entre em contato conosco para escolher outro horário. 💈`;

    const whatsappUrl =
      `https://wa.me/55${phone}` +
      `?text=${encodeURIComponent(message)}`;

    window.location.href = whatsappUrl;
  }

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

      /*
       * Atualiza o status no banco primeiro.
       * Somente depois abre o WhatsApp.
       */
      openWhatsApp(status);

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
