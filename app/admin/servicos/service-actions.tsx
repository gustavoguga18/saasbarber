"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ServiceActionsProps = {
  id: string;
  name: string;
  price: number;
  duration: number;
  active: boolean;
};

export default function ServiceActions({
  id,
  name,
  price,
  duration,
  active,
}: ServiceActionsProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [priceValue, setPriceValue] = useState(String(price));
  const [durationValue, setDurationValue] = useState(String(duration));
  const [loading, setLoading] = useState(false);

  async function updateService(data: Record<string, unknown>) {
    setLoading(true);

    try {
      const response = await fetch("/api/services", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Não foi possível atualizar o serviço.");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o serviço.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    updateService({
      name: nameValue,
      price: Number(priceValue),
      duration_minutes: Number(durationValue),
    });
  }

  function handleToggleActive() {
    const action = active ? "desativar" : "ativar";

    if (
      !window.confirm(
        `Tem certeza que deseja ${action} este serviço?`
      )
    ) {
      return;
    }

    updateService({
      active: !active,
    });
  }

  if (editing) {
    return (
      <div className="service-edit-form">
        <input
          type="text"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          placeholder="Nome"
        />

        <input
          type="number"
          value={priceValue}
          onChange={(event) => setPriceValue(event.target.value)}
          min="0"
          step="0.01"
          placeholder="Preço"
        />

        <select
          value={durationValue}
          onChange={(event) => setDurationValue(event.target.value)}
        >
          <option value="30">30 minutos</option>
          <option value="45">45 minutos</option>
          <option value="60">1 hora</option>
          <option value="75">1 hora e 15 minutos</option>
          <option value="90">1 hora e 30 minutos</option>
          <option value="120">2 horas</option>
        </select>

        <div className="service-action-buttons">
          <button
            type="button"
            className="service-action-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            className="service-action-cancel"
            onClick={() => setEditing(false)}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="service-actions">
      <button
        type="button"
        className="service-action-edit"
        onClick={() => setEditing(true)}
        disabled={loading}
      >
        ✏️ Editar
      </button>

      <button
        type="button"
        className={
          active
            ? "service-action-deactivate"
            : "service-action-activate"
        }
        onClick={handleToggleActive}
        disabled={loading}
      >
        {active ? "🔴 Desativar" : "🟢 Ativar"}
      </button>
    </div>
  );
}
