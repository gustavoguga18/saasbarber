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

export function BookingForm({ services }: { services: Service[] }) {
  const router = useRouter();

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedService = services.find(
    (service) => service.id === serviceId
  );

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      setTime("");
      return;
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setSlots([]);
      setTime("");
      setError("");

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível agendar.");
        setLoading(false);
        return;
      }

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

            {loadingSlots && (
              <small>Consultando...</small>
            )}
          </div>

          {!loadingSlots && slots.length === 0 && (
            <p className="no-slots">
              Não há horários disponíveis para esta data.
            </p>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div className="time-grid">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`time-slot ${
                    time === slot ? "selected" : ""
                  }`}
                  onClick={() => {
                    setTime(slot);
                    setError("");
                  }}
                >
                  {slot}
                </button>
              ))}
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

      {error && <p className="error">{error}</p>}

      <button
        type="submit"
        className="button booking-submit"
        disabled={loading || loadingSlots || !time}
      >
        {loading ? "Agendando..." : "Confirmar agendamento"}
      </button>

      <p className="form-note">
        Ao confirmar, seu pedido será enviado para a barbearia.
      </p>
    </form>
  );
}
