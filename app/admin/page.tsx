import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const today = new Date().toISOString().split("T")[0];

  const admin = createAdminClient();

  const { data: appointments } = await admin
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
    .eq("appointment_date", today)
    .order("start_time", { ascending: true });

  const totalAppointments = appointments?.length ?? 0;

  const confirmedAppointments =
    appointments?.filter(
      (appointment) => appointment.status === "confirmed"
    ).length ?? 0;

  const pendingAppointments =
    appointments?.filter(
      (appointment) => appointment.status === "pending"
    ).length ?? 0;

  const totalValue =
    appointments?.reduce(
      (total, appointment) =>
        total + Number(appointment.price ?? 0),
      0
    ) ?? 0;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
          <h1>Yago Barbershop</h1>
          <p>Visão geral dos seus agendamentos.</p>
        </div>

        <div className="admin-user">
          <span>{user.email}</span>
        </div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat">
          <span>Agendamentos hoje</span>
          <strong>{totalAppointments}</strong>
        </div>

        <div className="admin-stat">
          <span>Confirmados</span>
          <strong>{confirmedAppointments}</strong>
        </div>

        <div className="admin-stat">
          <span>Pendentes</span>
          <strong>{pendingAppointments}</strong>
        </div>

        <div className="admin-stat">
          <span>Valor previsto</span>
          <strong>
            R$ {totalValue.toFixed(2).replace(".", ",")}
          </strong>
        </div>
      </section>

      <section className="admin-content">
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="eyebrow">AGENDA</p>
              <h2>Agendamentos de hoje</h2>
            </div>

            <span>
              {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>

          {appointments && appointments.length > 0 ? (
            <div className="admin-appointments">
              {appointments.map((appointment) => {
                const service = Array.isArray(appointment.services)
                  ? appointment.services[0]
                  : appointment.services;

                const customer = Array.isArray(
                  appointment.customers
                )
                  ? appointment.customers[0]
                  : appointment.customers;

                const status =
                  appointment.status === "confirmed"
                    ? "Confirmado"
                    : appointment.status === "pending"
                      ? "Pendente"
                      : appointment.status;

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
                    </div>

                    <div className="admin-appointment-right">
                      <strong>
                        R${" "}
                        {Number(appointment.price)
                          .toFixed(2)
                          .replace(".", ",")}
                      </strong>

                      <span
                        className={`admin-status ${appointment.status}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">
              <span>📅</span>
              <strong>Nenhum agendamento hoje</strong>
              <p>
                Quando houver novos agendamentos, eles aparecerão
                aqui.
              </p>
            </div>
          )}
        </div>

        <aside className="admin-sidebar">
          <div className="admin-card">
            <p className="eyebrow">ACESSO RÁPIDO</p>
            <h2>Gerenciar</h2>

            <div className="admin-menu">
              <a href="/admin/agenda">📅 Agenda</a>
              <a href="/admin/clientes">👥 Clientes</a>
              <a href="/admin/servicos">✂️ Serviços</a>
              <a href="/admin/horarios">🕐 Horários</a>
              <a href="/admin/financeiro">💰 Financeiro</a>
              <a href="/admin/configuracoes">⚙️ Configurações</a>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
