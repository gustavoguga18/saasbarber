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
  serviceId?: string;
  canEdit?: boolean;
};

export function AgendaActions({
  appointmentId,
  customerName,
  customerPhone,
  serviceName,
  appointmentDate,
  startTime,
  price,
  serviceId,
  canEdit = false,
}: AgendaActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newDate, setNewDate] = useState(appointmentDate);
  const [newTime, setNewTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  function openWhatsApp(
    status: "confirmed" | "cancelled" | "rescheduled",
    date = appointmentDate,
    time = startTime
  ) {
    const phone = customerPhone.replace(/\D/g, "");

    if (!phone) {
      alert(
        "Este cliente não possui um número de WhatsApp válido."
      );
      return;
    }

    const [year, month, day] = date.split("-");

    const formattedDate =
      year && month && day
        ? `${day}/${month}/${year}`
        : date;

    const formattedTime = time
      ? time.slice(0, 5)
      : "";

    const formattedPrice = price
      .toFixed(2)
      .replace(".", ",");

    let message = "";

    if (status === "confirmed") {
      message = `Olá, ${customerName}! 👋

Seu agendamento na Yago Barbershop foi confirmado! ✅

📅 Data: ${formattedDate}
🕐 Horário: ${formattedTime}
✂️ Serviço: ${serviceName}
💰 Valor: R$ ${formattedPrice}

Te esperamos! 💈✂️`;
    }

    if (status === "cancelled") {
      message = `Olá, ${customerName}!

Seu agendamento na Yago Barbershop foi cancelado. ❌

📅 Data: ${formattedDate}
🕐 Horário: ${formattedTime}
✂️ Serviço: ${serviceName}

Caso queira, entre em contato conosco para escolher outro horário. 💈`;
    }

    if (status === "rescheduled") {
      message = `Olá, ${customerName}! 👋

Seu agendamento na Yago Barbershop foi alterado. 🔄

📅 Nova data: ${formattedDate}
🕐 Novo horário: ${formattedTime}
✂️ Serviço: ${serviceName}
💰 Valor: R$ ${formattedPrice}

Te esperamos! 💈✂️`;
    }

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

  async function loadSlots(date: string) {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlots([]);
    setNewTime("");

    try {
      const response = await fetch(
        `/api/availability?serviceId=${encodeURIComponent(
          serviceId
        )}&date=${encodeURIComponent(date)}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível consultar os horários."
        );
        return;
      }

      setSlots(data.slots ?? []);
    } catch {
      alert(
        "Não foi possível consultar os horários."
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  async function reschedule() {
    if (!newDate || !newTime) {
      alert("Escolha a nova data e horário.");
      return;
    }

    if (
      newDate === appointmentDate &&
      newTime === startTime.slice(0, 5)
    ) {
      alert(
        "Escolha um horário diferente do atual."
      );
      return;
    }

    if (
      !window.confirm(
        `Alterar o agendamento para ${newDate} às ${newTime}?`
      )
    ) {
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
            status: "confirmed",
            appointment_date: newDate,
            start_time: newTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível alterar o horário."
        );
        return;
      }

      setShowEdit(false);

      openWhatsApp(
        "rescheduled",
        newDate,
        newTime
      );

      router.refresh();
    } catch {
      alert(
        "Não foi possível alterar o horário."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-actions">
      {canEdit && (
        <>
          {!showEdit ? (
            <button
              type="button"
              className="admin-action-confirm"
              onClick={() => {
                setShowEdit(true);
                setNewDate(appointmentDate);
                setNewTime("");
                loadSlots(appointmentDate);
              }}
              disabled={loading}
            >
              Alterar horário
            </button>
          ) : (
            <div className="admin-reschedule">
              <label>
                Nova data
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setNewDate(date);
                    loadSlots(date);
                  }}
                />
              </label>

              <label>
                Novo horário
                <select
                  value={newTime}
                  onChange={(e) =>
                    setNewTime(e.target.value)
                  }
                  disabled={
                    loadingSlots ||
                    slots.length === 0
                  }
                >
                  <option value="">
                    {loadingSlots
                      ? "Consultando..."
                      : "Escolha um horário"}
                  </option>

                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-reschedule-buttons">
                <button
                  type="button"
                  className="admin-action-confirm"
                  onClick={reschedule}
                  disabled={
                    loading ||
                    loadingSlots ||
                    !newTime
                  }
                >
                  {loading
                    ? "Salvando..."
                    : "Salvar horário"}
                </button>

                <button
                  type="button"
                  className="admin-action-cancel"
                  onClick={() => {
                    setShowEdit(false);
                    setNewTime("");
                  }}
                  disabled={loading}
                >
                  Voltar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!canEdit && (
        <button
          type="button"
          className="admin-action-confirm"
          onClick={() =>
            updateStatus("confirmed")
          }
          disabled={loading}
        >
          {loading ? "..." : "Confirmar"}
        </button>
      )}

      <button
        type="button"
        className="admin-action-cancel"
        onClick={() =>
          updateStatus("cancelled")
        }
        disabled={loading}
      >
        Cancelar
      </button>
    </div>
  );
}
