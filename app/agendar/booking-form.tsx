"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

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
  }

  const selectedService = services.find(
    (service) => service.id === serviceId
  );

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

          <span>
            {selectedService.duration_minutes} min
          </span>
        </div>
      )}

      <div className="form-grid">
        <label>
          Data

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Horário

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>
      </div>

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
        disabled={loading}
      >
        {loading ? "Agendando..." : "Confirmar agendamento"}
      </button>

      <p className="form-note">
        Ao confirmar, seu pedido será enviado para a barbearia.
      </p>
    </form>
  );
}
