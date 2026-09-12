"use client";

import { useState } from "react";

type Appointment = {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  services:
    | {
        name: string;
        price: number;
      }
    | {
        name: string;
        price: number;
      }[]
    | null;
};

type CustomerHistoryProps = {
  appointments: Appointment[];
};

export default function CustomerHistory({
  appointments,
}: CustomerHistoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="customer-history-wrapper">
      <button
        type="button"
        className="customer-history-button"
        onClick={() => setOpen(!open)}
      >
        {open ? "Ocultar histórico" : "Ver histórico"}
      </button>

      {open && (
        <div className="customer-history">
          <strong>Histórico de agendamentos</strong>

          {appointments.length > 0 ? (
            <div className="customer-history-list">
              {appointments.map((appointment) => {
                const service = Array.isArray(appointment.services)
                  ? appointment.services[0]
                  : appointment.services;

                return (
                  <div
                    className="customer-history-item"
                    key={appointment.id}
                  >
                    <span>
                      📅 {appointment.appointment_date}
                    </span>

                    <span>
                      🕐 {appointment.start_time?.slice(0, 5)}
                    </span>

                    <span>
                      ✂️{" "}
                      {service?.name ?? "Serviço não informado"}
                    </span>

                    <span>
                      💰 R${" "}
                      {Number(service?.price ?? 0)
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>

                    <span>
                      📌{" "}
                      {appointment.status === "confirmed"
                        ? "Confirmado"
                        : appointment.status === "pending"
                        ? "Pendente"
                        : appointment.status === "cancelled"
                        ? "Cancelado"
                        : appointment.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Nenhum agendamento encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
