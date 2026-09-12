"use client";

import { useState } from "react";

export default function ServiceForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price,
          duration_minutes: duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Não foi possível cadastrar o serviço.");
        return;
      }

      setName("");
      setPrice("");
      setDuration("30");
      setMessage("Serviço cadastrado com sucesso.");
    } catch (error) {
      console.error(error);
      setMessage("Erro ao cadastrar o serviço.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="service-form">
      <div className="admin-card-header">
        <div>
          <p className="eyebrow">NOVO SERVIÇO</p>
          <h2>Cadastrar serviço</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="service-form-grid">
          <label>
            Nome do serviço
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Corte masculino"
              required
            />
          </label>

          <label>
            Preço
            <input
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="30.00"
              min="0"
              step="0.01"
              required
            />
          </label>

          <label>
            Duração
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            >
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="75">1 hora e 15 minutos</option>
              <option value="90">1 hora e 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="button"
          disabled={loading}
        >
          {loading ? "Cadastrando..." : "Cadastrar serviço"}
        </button>

        {message && (
          <p className="service-form-message">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
