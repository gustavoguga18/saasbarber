"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
};

export function BookingForm({
  services,
  adminMode = false,
}: {
  services: Service[];
  adminMode?: boolean;
}) {
  const router = useRouter();

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [barbershopClosed, setBarbershopClosed] = useState(false);
  const [closedReason, setClosedReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedService = services.find(
    (service) => service.id === serviceId
  );

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      setTime("");
      setBarbershopClosed(false);
      setClosedReason("");
      return;
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setSlots([]);
      setTime("");
      setError("");
      setBarbershopClosed(false);
      setClosedReason("");

      try {
        const response = await fetch(
          `/api/availability?serviceId=${encodeURIComponent(
            serviceId
          )}&date=${encodeURIComponent(date)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ?? "Não foi possível consultar os horários."
          );
          return;
        }

        if (data.closed) {
          setBarbershopClosed(true);
          setClosedReason(data.reason ?? "");
          return;
        }

        setSlots(data.slots ?? []);
      } catch {
        setError("Não foi possível consultar os horários.");
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [serviceId, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (barbershopClosed) {
      setError("A barbearia está fechada nesta data.");
      return;
    }

    if (!time) {
      setError("Escolha um horário.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          time,
          name,
          phone,
          paymentMethod,
          adminMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível agendar.");
        setLoading(false);
        return;
      }

      if (adminMode) {
  router.push("/admin/agenda");
} else {
  router.push(`/confirmacao?id=${data.id}`);
} catch {
      setError("Não foi possível realizar o agendamento.");
      setLoading(false);
    }
  }

  return (
    <form className="form booking-form" onSubmit={submit}>
      <div className="form-header">
        <p className="eyebrow">AGENDAMENTO</p>
        <h1>Escolha seu horário</h1>
        <p>
          Preencha os dados abaixo para solicitar seu atendimento.
        </p>
      </div>

      <label>
        Serviço
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          required
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — R$ {Number(s.price).toFixed(2).replace(".", ",")}
            </option>
          ))}
        </select>
      </label>

      {selectedService && (
        <div className="selected-service">
          <div>
            <strong>{selectedService.name}</strong>

            {selectedService.description && (
              <p>{selectedService.description}</p>
            )}
          </div>

          <span>{selectedService.duration_minutes} min</span>
        </div>
      )}

      <label>
        Data
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>

      {date && (
        <div className="time-selection">
          <div className="time-selection-header">
            <span>Horários disponíveis</span>

            {loadingSlots && <small>Consultando...</small>}
          </div>

          {!loadingSlots && barbershopClosed && (
            <div className="barbershop-closed">
              <div className="barbershop-closed-icon">
                🔒
              </div>

              <div>
                <strong>Barbearia fechada</strong>

                <p>
                  Não estamos atendendo nesta data.
                </p>

                {closedReason && (
                  <span>
                    Motivo: {closedReason}
                  </span>
                )}
              </div>
            </div>
          )}

          {!loadingSlots &&
            !barbershopClosed &&
            slots.length > 0 && (
              <>
                {!time ? (
                  <div className="time-grid">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className="time-slot"
                        onClick={() => {
                          setTime(slot);
                          setError("");
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="selected-time-container">
                    <div className="selected-time">
                      <span>Horário selecionado</span>
                      <strong>{time}</strong>
                    </div>

                    <button
                      type="button"
                      className="change-time-button"
                      onClick={() => {
                        setTime("");
                        setError("");
                      }}
                    >
                      Alterar horário
                    </button>
                  </div>
                )}
              </>
            )}

          {!loadingSlots &&
            !barbershopClosed &&
            slots.length === 0 && (
              <div className="admin-empty">
                <span>⏰</span>
                <strong>Nenhum horário disponível</strong>
                <p>
                  Não há horários disponíveis nesta data.
                </p>
              </div>
            )}
        </div>
      )}

      <label>
        Nome
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Digite seu nome"
          required
        />
      </label>

      <label>
        WhatsApp
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(85) 99999-9999"
          inputMode="tel"
          required
        />
      </label>

      <label>
        Forma de pagamento
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">Selecione uma opção</option>
          <option value="pix">PIX</option>
          <option value="card">Crédito / Débito</option>
          <option value="cash">Espécie</option>
        </select>
      </label>

      {error && <p className="error">{error}</p>}

      <button
        type="submit"
        className="button booking-submit"
        disabled={
          loading ||
          loadingSlots ||
          !time ||
          barbershopClosed
        }
      >
        {loading
  ? "Agendando..."
  : adminMode
    ? "Agendar manualmente"
    : "Confirmar agendamento"}
      </button>

      <p className="form-note">
  {adminMode
    ? "Este agendamento será confirmado imediatamente."
    : "Ao confirmar, seu pedido será enviado para a barbearia."}
</p>
    </form>
  );
}
