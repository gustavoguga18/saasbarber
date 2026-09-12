"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BlockedDate = {
  id: string;
  blocked_date: string;
  reason: string | null;
};

type BlockedDatesFormProps = {
  blockedDates: BlockedDate[];
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

export default function BlockedDatesForm({
  blockedDates,
}: BlockedDatesFormProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function addBlockedDates() {
    if (!startDate) {
      alert("Selecione a data inicial.");
      return;
    }

    const finalDate = endDate || startDate;

    if (finalDate < startDate) {
      alert("A data final não pode ser anterior à data inicial.");
      return;
    }

    setLoading(true);

    try {
      const current = new Date(`${startDate}T12:00:00`);
      const end = new Date(`${finalDate}T12:00:00`);

      while (current <= end) {
        const date = current.toISOString().split("T")[0];

        const response = await fetch("/api/blocked-dates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blocked_date: date,
            reason: reason.trim() || null,
          }),
        });

        const data = await response.json();

        if (!response.ok && response.status !== 409) {
          alert(
            data.error ??
              "Não foi possível bloquear a data."
          );
          return;
        }

        current.setDate(current.getDate() + 1);
      }

      setStartDate("");
      setEndDate("");
      setReason("");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao bloquear as datas.");
    } finally {
      setLoading(false);
    }
  }

  async function removeBlockedDate(id: string) {
    const confirmed = window.confirm(
      "Deseja realmente remover este dia fechado?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/blocked-dates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível remover o bloqueio."
        );
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao remover o bloqueio.");
    }
  }

  return (
    <div className="blocked-dates-wrapper">
      <div className="blocked-dates-form">
        <div className="blocked-dates-form-grid">
          <label>
            Data inicial
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </label>

          <label>
            Data final
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </label>

          <label className="blocked-dates-reason">
            Motivo
            <input
              type="text"
              value={reason}
              maxLength={100}
              placeholder="Ex.: Viagem"
              onChange={(event) =>
                setReason(event.target.value)
              }
            />
          </label>
        </div>

        <div className="blocked-dates-action">
          <button
            type="button"
            className="button"
            onClick={addBlockedDates}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Fechar período"}
          </button>
        </div>
      </div>

      <div className="blocked-dates-list">
        {blockedDates.length === 0 ? (
          <div className="admin-empty">
            <span>📅</span>
            <strong>Nenhum dia fechado</strong>
            <p>
              A barbearia está disponível conforme os horários da semana.
            </p>
          </div>
        ) : (
          blockedDates.map((item) => (
            <div
              className="blocked-date-item"
              key={item.id}
            >
              <div>
                <strong>
                  {formatDate(item.blocked_date)}
                </strong>

                {item.reason && (
                  <span>{item.reason}</span>
                )}
              </div>

              <button
                type="button"
                className="blocked-date-remove"
                onClick={() =>
                  removeBlockedDate(item.id)
                }
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
