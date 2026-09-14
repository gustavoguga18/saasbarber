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

  const [serviceId, setServiceId] = useState(
    services[0]?.id ?? ""
  );

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

  // =========================
  // SEMANA DE AGENDAMENTO
  // =========================
  //
  // Para clientes:
  //
  // Segunda a sábado:
  // → agenda da semana atual
  //
  // Domingo:
  // → abre a agenda da próxima semana
  //
  // Domingo nunca é dia de atendimento.
  //
  // O adminMode continua podendo escolher
  // qualquer data manualmente.

  function getBookingWeek() {
    const now = new Date();

    // Corrige a data para evitar problemas de UTC
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const dayOfWeek = today.getDay();

    let monday: Date;

    if (dayOfWeek === 0) {
      // DOMINGO
      //
      // Abre a próxima semana.
      //
      monday = new Date(today);
      monday.setDate(
        today.getDate() + 1
      );
    } else {
      // SEGUNDA A SÁBADO
      //
      // Usa a segunda-feira desta semana.
      //
      monday = new Date(today);
      monday.setDate(
        today.getDate() - (dayOfWeek - 1)
      );
    }

    // Último dia permitido para atendimento:
    // sábado.
    const saturday = new Date(monday);
    saturday.setDate(
      monday.getDate() + 5
    );

    return {
      monday,
      saturday,
    };
  }

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const bookingWeek = getBookingWeek();

  const minBookingDate = formatDate(
    bookingWeek.monday
  );

  const maxBookingDate = formatDate(
    bookingWeek.saturday
  );

  // =========================
  // VALIDAÇÃO DA DATA
  // =========================

  useEffect(() => {
    if (adminMode || !date) {
      return;
    }

    if (
      date < minBookingDate ||
      date > maxBookingDate
    ) {
      setDate("");
      setTime("");
      setSlots([]);
      setError(
        "Essa data não está disponível para agendamento."
      );
    }
  }, [
    date,
    minBookingDate,
    maxBookingDate,
    adminMode,
  ]);

  // =========================
  // BUSCAR HORÁRIOS
  // =========================

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
            data.error ??
              "Não foi possível consultar os horários."
          );
          return;
        }

        if (data.closed) {
          setBarbershopClosed(true);
          setClosedReason(
            data.reason ?? ""
          );
          return;
        }

        setSlots(data.slots ?? []);
      } catch {
        setError(
          "Não foi possível consultar os horários."
        );
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [serviceId, date]);

  // =========================
  // ENVIAR AGENDAMENTO
  // =========================

  async function submit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (barbershopClosed) {
      setError(
        "A barbearia está fechada nesta data."
      );
      return;
    }

    if (!time) {
      setError(
        "Escolha um horário."
      );
      return;
    }

    // Segurança adicional no cliente.
    // A API também deverá validar essa regra.
    if (!adminMode) {
      if (
        date < minBookingDate ||
        date > maxBookingDate
      ) {
        setError(
          "Essa data não está disponível para agendamento."
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            serviceId,
            date,
            time,
            name,
            phone,
            paymentMethod,
            adminMode,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Não foi possível agendar."
        );
        setLoading(false);
        return;
      }

      if (adminMode) {
        router.push(
          "/admin/agenda"
        );
      } else {
        router.push(
          `/confirmacao?id=${data.id}`
        );
      }
    } catch {
      setError(
        "Não foi possível realizar o agendamento."
      );
      setLoading(false);
    }
  }

  return (
    <form
      className="form booking-form"
      onSubmit={submit}
    >
      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="form-header">
        <p className="eyebrow">
          AGENDAMENTO
        </p>

        <h1>
          {adminMode
            ? "Agendamento manual"
            : "Escolha seu horário"}
        </h1>

        <p>
          {adminMode
            ? "Preencha os dados do cliente para reservar este horário."
            : "Preencha os dados abaixo para solicitar seu atendimento."}
        </p>
      </div>

      {/* =========================
          SERVIÇO
      ========================= */}

      <label>
        Serviço

        <select
          value={serviceId}
          onChange={(e) =>
            setServiceId(e.target.value)
          }
          required
        >
          {services.map((s) => (
            <option
              key={s.id}
              value={s.id}
            >
              {s.name} — R${" "}
              {Number(s.price)
                .toFixed(2)
                .replace(".", ",")}
            </option>
          ))}
        </select>
      </label>

      {/* =========================
          SERVIÇO SELECIONADO
      ========================= */}

      {selectedService && (
        <div className="selected-service">
          <div>
            <strong>
              {selectedService.name}
            </strong>

            {selectedService.description && (
              <p>
                {
                  selectedService.description
                }
              </p>
            )}
          </div>

          <span>
            {
              selectedService.duration_minutes
            }{" "}
            min
          </span>
        </div>
      )}

      {/* =========================
          DATA
      ========================= */}

      <label>
        Data

        <input
          type="date"
          value={date}
          min={
            adminMode
              ? undefined
              : minBookingDate
          }
          max={
            adminMode
              ? undefined
              : maxBookingDate
          }
          onChange={(e) => {
            const selectedDate =
              e.target.value;

            setTime("");
            setError("");

            if (!adminMode) {
              if (
                selectedDate <
                  minBookingDate ||
                selectedDate >
                  maxBookingDate
              ) {
                setDate("");
                setError(
                  "Escolha uma data dentro da semana de agendamento."
                );
                return;
              }
            }

            setDate(selectedDate);
          }}
          required
        />

        {!adminMode && (
          <small className="form-note">
            A agenda desta semana fica disponível
            para agendamentos de segunda a sábado.
          </small>
        )}
      </label>

      {/* =========================
          HORÁRIOS
      ========================= */}

      {date && (
        <div className="time-selection">
          <div className="time-selection-header">
            <span>
              Horários disponíveis
            </span>

            {loadingSlots && (
              <small>
                Consultando...
              </small>
            )}
          </div>

          {/* BARBEARIA FECHADA */}

          {!loadingSlots &&
            barbershopClosed && (
              <div className="barbershop-closed">
                <div className="barbershop-closed-icon">
                  🔒
                </div>

                <div>
                  <strong>
                    Barbearia fechada
                  </strong>

                  <p>
                    Não estamos atendendo nesta
                    data.
                  </p>

                  {closedReason && (
                    <span>
                      Motivo:{" "}
                      {closedReason}
                    </span>
                  )}
                </div>
              </div>
            )}

          {/* HORÁRIOS */}

          {!loadingSlots &&
            !barbershopClosed &&
            slots.length > 0 && (
              <>
                {!time ? (
                  <div className="time-grid">
                    {slots.map(
                      (slot) => (
                        <button
                          key={slot}
                          type="button"
                          className="time-slot"
                          onClick={() => {
                            setTime(
                              slot
                            );
                            setError("");
                          }}
                        >
                          {slot}
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="selected-time-container">
                    <div className="selected-time">
                      <span>
                        Horário selecionado
                      </span>

                      <strong>
                        {time}
                      </strong>
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

          {/* NENHUM HORÁRIO */}

          {!loadingSlots &&
            !barbershopClosed &&
            slots.length === 0 && (
              <div className="admin-empty">
                <span>⏰</span>

                <strong>
                  Nenhum horário disponível
                </strong>

                <p>
                  Não há horários disponíveis
                  nesta data.
                </p>
              </div>
            )}
        </div>
      )}

      {/* =========================
          NOME
      ========================= */}

      <label>
        Nome

        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Digite seu nome"
          required
        />
      </label>

      {/* =========================
          WHATSAPP
      ========================= */}

      <label>
        WhatsApp

        <input
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          placeholder="(85) 99999-9999"
          inputMode="tel"
          required
        />
      </label>

      {/* =========================
          PAGAMENTO
      ========================= */}

      <label>
        Forma de pagamento

        <select
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(
              e.target.value
            )
          }
          required
        >
          <option value="">
            Selecione uma opção
          </option>

          <option value="pix">
            PIX
          </option>

          <option value="card">
            Crédito / Débito
          </option>

          <option value="cash">
            Espécie
          </option>
        </select>
      </label>

      {/* =========================
          ERRO
      ========================= */}

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {/* =========================
          BOTÃO
      ========================= */}

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

      {/* =========================
          OBSERVAÇÃO
      ========================= */}

      <p className="form-note">
        {adminMode
          ? "Este agendamento será confirmado imediatamente."
          : "Ao confirmar, seu pedido será enviado para a barbearia."}
      </p>
    </form>
  );
}
