import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function AgendaPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: appointments } = await supabase
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
                      {appointment.appointment_date}
                    </small>
                  </div>

                  <div className="admin-appointment-right">
                    <strong>
                      R${" "}
                      {Number(appointment.price)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>

                    <div className="admin-actions">
                      <form action="/api/admin/appointments" method="POST">
                        <input type="hidden" name="id" value={appointment.id} />
                      </form>

                      <a
                        href={`/admin/agenda?confirm=${appointment.id}`}
                        className="admin-action-confirm"
                      >
                        Confirmar
                      </a>

                      <a
                        href={`/admin/agenda?cancel=${appointment.id}`}
                        className="admin-action-cancel"
                      >
                        Cancelar
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            <span>✓</span>
            <strong>Nenhum agendamento pendente</strong>
            <p>Todos os pedidos estão em dia.</p>
          </div>
        )}
      </section>

      <section className="admin-card agenda-section">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">CONFIRMADOS</p>
            <h2>Agendamentos confirmados</h2>
          </div>

          <span>{confirmed.length} confirmado(s)</span>
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
                      {appointment.appointment_date}
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
            <strong>Nenhum agendamento confirmado</strong>
          </div>
        )}
      </section>
    </main>
  );
}
