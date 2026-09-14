"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SpecialHour = {
  id: string;
  special_date: string;
  open_time: string;
  close_time: string;
  reason: string | null;
};

type SpecialHoursFormProps = {
  specialHours: SpecialHour[];
};

export default function SpecialHoursForm({
  specialHours,
}: SpecialHoursFormProps) {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!date || !openTime || !closeTime) {
      alert("Preencha a data, abertura e fechamento.");
      return;
    }

    if (openTime >= closeTime) {
      alert(
        "O horário de abertura deve ser anterior ao horário de fechamento."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/special-hours",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            special_date: date,
            open_time: openTime,
            close_time: closeTime,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível cadastrar o horário especial."
        );
        return;
      }

      setDate("");
      setOpenTime("");
      setCloseTime("");
      setReason("");

      router.refresh();
    } catch {
      alert(
        "Não foi possível cadastrar o horário especial."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Remover este horário especial?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/special-hours",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível remover o horário especial."
        );
        return;
      }

      router.refresh();
    } catch {
      alert(
        "Não foi possível remover o horário especial."
      );
    }
  }

  return (
    <div className="special-hours-container">
      <form
        onSubmit={handleSubmit}
        className="special-hours-form"
      >
        <div className="special-hours-fields">
          <div>
            <label htmlFor="special-date">
              Data
            </label>

            <input
              id="special-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="special-open">
              Abertura
            </label>

            <input
              id="special-open"
              type="time"
              value={openTime}
              onChange={(event) =>
                setOpenTime(event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="special-close">
              Fechamento
            </label>

            <input
              id="special-close"
              type="time"
              value={closeTime}
              onChange={(event) =>
                setCloseTime(event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="special-reason">
              Motivo
            </label>

            <input
              id="special-reason"
              type="text"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Ex.: Compromisso"
            />
          </div>
        </div>

        <button
          type="submit"
          className="button"
          disabled={loading}
        >
          {loading
            ? "Salvando..."
            : "Adicionar horário especial"}
        </button>
      </form>

      {specialHours.length > 0 ? (
        <div className="special-hours-list">
          {specialHours.map((specialHour) => (
            <div
              key={specialHour.id}
              className="special-hour-item"
            >
              <div>
                <strong>
                  {specialHour.special_date}
                </strong>

                <p>
                  {specialHour.open_time.slice(0, 5)}
                  {" às "}
                  {specialHour.close_time.slice(0, 5)}
                </p>

                {specialHour.reason && (
                  <small>
                    {specialHour.reason}
                  </small>
                )}
              </div>

              <button
                type="button"
                className="admin-action-cancel"
                onClick={() =>
                  handleDelete(specialHour.id)
                }
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <span>🕐</span>
          <strong>
            Nenhum horário especial
          </strong>
          <p>
            A barbearia está usando os horários
            normais da semana.
          </p>
        </div>
      )}
    </div>
  );
}
