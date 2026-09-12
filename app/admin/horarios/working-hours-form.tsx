"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type WorkingHour = {
  id: string;
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  active: boolean;
};

type WorkingHoursFormProps = {
  workingHours: WorkingHour[];
};

const days = [
  { value: 0, name: "Domingo" },
  { value: 1, name: "Segunda-feira" },
  { value: 2, name: "Terça-feira" },
  { value: 3, name: "Quarta-feira" },
  { value: 4, name: "Quinta-feira" },
  { value: 5, name: "Sexta-feira" },
  { value: 6, name: "Sábado" },
];

export default function WorkingHoursForm({
  workingHours,
}: WorkingHoursFormProps) {
  const router = useRouter();

  const [hours, setHours] = useState(workingHours);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);

  function updateLocalHour(
    id: string,
    field: "open_time" | "close_time" | "active",
    value: string | boolean
  ) {
    setHours((current) =>
      current.map((hour) =>
        hour.id === id
          ? {
              ...hour,
              [field]: value,
            }
          : hour
      )
    );

    setMessageId(null);
  }

  async function saveHour(hour: WorkingHour) {
    setLoadingId(hour.id);
    setMessageId(null);

    try {
      const response = await fetch("/api/working-hours", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: hour.id,
          open_time: hour.open_time,
          close_time: hour.close_time,
          active: hour.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ?? "Não foi possível salvar o horário."
        );
        return;
      }

      setHours((current) =>
        current.map((item) =>
          item.id === hour.id
            ? {
                ...item,
                open_time: data.workingHour.open_time,
                close_time: data.workingHour.close_time,
                active: data.workingHour.active,
              }
            : item
        )
      );

      setMessageId(hour.id);

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o horário.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="working-hours-list">
      {days.map((day) => {
        const hour = hours.find(
          (item) => item.weekday === day.value
        );

        if (!hour) {
          return null;
        }

        const loading = loadingId === hour.id;

        return (
          <div
            className="working-hours-item"
            key={hour.id}
          >
            <div className="working-hours-day">
              <strong>{day.name}</strong>

              <label className="working-hours-toggle">
                <input
                  type="checkbox"
                  checked={hour.active}
                  onChange={(event) =>
                    updateLocalHour(
                      hour.id,
                      "active",
                      event.target.checked
                    )
                  }
                />

                <span>
                  {hour.active ? "Aberto" : "Fechado"}
                </span>
              </label>
            </div>

            {hour.active && (
              <div className="working-hours-times">
                <label>
                  Abertura

                  <input
                    type="time"
                    value={
                      hour.open_time?.slice(0, 5) ?? ""
                    }
                    onChange={(event) =>
                      updateLocalHour(
                        hour.id,
                        "open_time",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Fechamento

                  <input
                    type="time"
                    value={
                      hour.close_time?.slice(0, 5) ?? ""
                    }
                    onChange={(event) =>
                      updateLocalHour(
                        hour.id,
                        "close_time",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>
            )}

            <div className="working-hours-save-wrapper">
              <button
                type="button"
                className="button working-hours-save"
                onClick={() => saveHour(hour)}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>

              {messageId === hour.id && (
                <span className="working-hours-success">
                  ✓ Horário alterado com sucesso
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
