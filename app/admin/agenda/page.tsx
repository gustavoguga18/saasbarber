import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";
import { AgendaActions } from "./agenda-actions";

export default async function AgendaPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = createAdminClient();

  const { data: appointments, error: appointmentsError } = await admin
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      status,
      price,
      services (
        name
      ),
      customers (
        name,
        phone
      )
    `)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (appointmentsError) {
    console.error(
      "Erro ao buscar agendamentos:",
      appointmentsError
    );
  }

  const pending =
    appointments?.filter(
      (appointment) => appointment.status === "pending"
    ) ?? [];

  const confirmed =
    appointments?.filter(
      (appointment) => appointment.status === "confirmed"
    ) ?? [];

  const cancelled =
    appointments?.filter(
      (appointment) => appointment.status === "cancelled"
    ) ?? [];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
          <h1>Agenda</h1>
          <p>Gerencie os agendamentos da barbearia.</p>
        </div>

        <div className="admin-user">
          <span>{user.email}</span>
        </div>
      </header>

      {/* =========================
          PENDENTES
      ========================= */}

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">PENDENTES</p>
            <h2>Pedidos aguardando confirmação</h2>
          </div>

          <span>{pending.length} pendente(s)</span>
        </div>

        {pending.length > 0 ? (
          <div className="admin-appointments">
            {pending.map((appointment) => {
              const service = Array.isArray(appointment.services)
                ? appointment.services[0]
                : appointment.services;

              const customer = Array.isArray(appointment.customers)
                ? appointment.customers[0]
                : appointment.customers;

              return (
                <div
                  className="admin-appointment"
                  key={appointment.id}
                >
                  <div className="admin-time">
                    {appointment.start_time?.slice(0, 5)}
                  </div>

                  <div className="admin-appointment-info">
                    <strong>
                      {customer?.name ?? "Cliente"}
                    </strong>

                    <span>
                      {service?.name ?? "Serviço"}
                    </span>

                    <small>
                      {customer?.phone ?? ""}
                    </small>

                    <small>
                      📅 {appointment.appointment_date}
                    </small>
                  </div>

                  <div className="admin-appointment-right">
                    <strong>
                      R${" "}
                      {Number(appointment.price)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>

                    <AgendaActions
                      appointmentId={appointment.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            <span>✓</span>

            <strong>
              Nenhum agendamento pendente
            </strong>

            <p>
              Todos os pedidos estão em dia.
            </p>
          </div>
        )}
      </section>

      {/* =========================
          CONFIRMADOS
      ========================= */}

      <section className="admin-card agenda-section">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">CONFIRMADOS</p>
            <h2>Agendamentos confirmados</h2>
          </div>

          <span>
            {confirmed.length} confirmado(s)
          </span>
        </div>

        {confirmed.length > 0 ? (
          <div className="admin-appointments">
            {confirmed.map((appointment) => {
              const service = Array.isArray(appointment.services)
                ? appointment.services[0]
                : appointment.services;

              const customer = Array.isArray(appointment.customers)
                ? appointment.customers[0]
                : appointment.customers;

              return (
                <div
                  className="admin-appointment"
                  key={appointment.id}
                >
                  <div className="admin-time">
                    {appointment.start_time?.slice(0, 5)}
                  </div>

                  <div className="admin-appointment-info">
                    <strong>
                      {customer?.name ?? "Cliente"}
                    </strong>

                    <span>
                      {service?.name ?? "Serviço"}
                    </span>

                    <small>
                      {customer?.phone ?? ""}
                    </small>

                    <small>
                      📅 {appointment.appointment_date}
                    </small>
                  </div>

                  <div className="admin-appointment-right">
                    <strong>
                      R${" "}
                      {Number(appointment.price)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>

                    <span className="admin-status confirmed">
                      Confirmado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            <span>📅</span>

            <strong>
              Nenhum agendamento confirmado
            </strong>

            <p>
              Os agendamentos confirmados aparecerão aqui.
            </p>
          </div>
        )}
      </section>

      {/* =========================
          CANCELADOS
      ========================= */}

      <section className="admin-card agenda-section">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">CANCELADOS</p>
            <h2>Agendamentos cancelados</h2>
          </div>

          <span>
            {cancelled.length} cancelado(s)
          </span>
        </div>

        {cancelled.length > 0 ? (
          <div className="admin-appointments">
            {cancelled.map((appointment) => {
              const service = Array.isArray(appointment.services)
                ? appointment.services[0]
                : appointment.services;

              const customer = Array.isArray(appointment.customers)
                ? appointment.customers[0]
                : appointment.customers;

              return (
                <div
                  className="admin-appointment"
                  key={appointment.id}
                >
                  <div className="admin-time">
                    {appointment.start_time?.slice(0, 5)}
                  </div>

                  <div className="admin-appointment-info">
                    <strong>
                      {customer?.name ?? "Cliente"}
                    </strong>

                    <span>
                      {service?.name ?? "Serviço"}
                    </span>

                    <small>
                      {customer?.phone ?? ""}
                    </small>

                    <small>
                      📅 {appointment.appointment_date}
                    </small>
                  </div>

                  <div className="admin-appointment-right">
                    <strong>
                      R${" "}
                      {Number(appointment.price)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>

                    <span className="admin-status cancelled">
                      Cancelado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            <span>—</span>

            <strong>
              Nenhum agendamento cancelado
            </strong>

            <p>
              Os cancelamentos aparecerão aqui.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
