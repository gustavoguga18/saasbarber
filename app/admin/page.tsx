import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";
import AdminSidebar from "./admin-sidebar";
import AdminRealtime from "./admin-realtime";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // =========================
  // DATA E HORA - FORTALEZA
  // =========================

  const now = new Date();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
  }).format(now);

  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const admin = createAdminClient();

  // =========================
  // AGENDAMENTOS DE HOJE
  // =========================

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

  // =========================
  // ESTATÍSTICAS
  // =========================

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
    appointments
      ?.filter(
        (appointment) =>
          appointment.status === "pending" ||
          appointment.status === "confirmed"
      )
      .reduce(
        (total, appointment) =>
          total + Number(appointment.price ?? 0),
        0
      ) ?? 0;

  const cancelledAppointments =
    appointments?.filter(
      (appointment) => appointment.status === "cancelled"
    ).length ?? 0;

  const confirmedValue =
    appointments
      ?.filter(
        (appointment) => appointment.status === "confirmed"
      )
      .reduce(
        (total, appointment) =>
          total + Number(appointment.price ?? 0),
        0
      ) ?? 0;

  const pendingValue =
    appointments
      ?.filter(
        (appointment) => appointment.status === "pending"
      )
      .reduce(
        (total, appointment) =>
          total + Number(appointment.price ?? 0),
        0
      ) ?? 0;

  // =========================
  // PRÓXIMO ATENDIMENTO
  // =========================
  //
  // Considera somente:
  // - agendamentos de hoje
  // - pendentes ou confirmados
  // - horários que ainda não passaram
  //
  // Como os agendamentos já estão ordenados
  // por start_time, o primeiro encontrado
  // será o próximo atendimento.

  const nextAppointment = appointments?.find(
    (appointment) =>
      (appointment.status === "pending" ||
        appointment.status === "confirmed") &&
      (appointment.start_time?.slice(0, 5) ?? "") >= currentTime
  );

  const nextCustomer = Array.isArray(nextAppointment?.customers)
    ? nextAppointment.customers[0]
    : nextAppointment?.customers;

  const nextService = Array.isArray(nextAppointment?.services)
    ? nextAppointment.services[0]
    : nextAppointment?.services;

  return (
    <main className="admin-page">
      <AdminRealtime />

      <AdminSidebar />

      {/* =========================
          CABEÇALHO
      ========================= */}

      <header className="admin-header">
        <div>
          <p className="eyebrow">PAINEL ADMINISTRATIVO</p>

          <h1>Yago Barbershop</h1>

          <p>
            Visão geral dos seus agendamentos.
          </p>
        </div>

        <div className="admin-user">
          <span>{user.email}</span>
        </div>
      </header>

      {/* =========================
          ESTATÍSTICAS
      ========================= */}

      <section className="admin-stats">
        <div className="admin-stat">
          <span>Agendamentos hoje</span>

          <strong>
            {totalAppointments}
          </strong>
        </div>

        <div className="admin-stat">
          <span>Confirmados</span>

          <strong>
            {confirmedAppointments}
          </strong>
        </div>

        <div className="admin-stat">
          <span>Pendentes</span>

          <strong>
            {pendingAppointments}
          </strong>
        </div>

        <div className="admin-stat">
          <span>Valor previsto</span>

          <strong>
            R$ {totalValue.toFixed(2).replace(".", ",")}
          </strong>
        </div>
      </section>

      {/* =========================
          RESUMO DO DIA
      ========================= */}

      <section className="admin-day-summary">
        <div className="admin-day-summary-card">
          <span className="admin-day-summary-label">
            CONFIRMADOS
          </span>

          <strong>
            {confirmedAppointments}
          </strong>

          <small>
            R$ {confirmedValue.toFixed(2).replace(".", ",")}
          </small>
        </div>

        <div className="admin-day-summary-card">
          <span className="admin-day-summary-label">
            PENDENTES
          </span>

          <strong>
            {pendingAppointments}
          </strong>

          <small>
            R$ {pendingValue.toFixed(2).replace(".", ",")}
          </small>
        </div>

        <div className="admin-day-summary-card">
          <span className="admin-day-summary-label">
            CANCELADOS
          </span>

          <strong>
            {cancelledAppointments}
          </strong>

          <small>
            Agendamentos cancelados
          </small>
        </div>
      </section>

      {/* =========================
          CONTEÚDO
      ========================= */}

      <section className="admin-content">

        {/* =========================
            PRÓXIMO ATENDIMENTO
        ========================= */}

        {nextAppointment && (
          <div className="admin-card admin-next-appointment">
            <div>
              <p className="eyebrow">
                PRÓXIMO ATENDIMENTO
              </p>

              <h2>
                {nextAppointment.start_time?.slice(0, 5)}
              </h2>
            </div>

            <div className="admin-next-info">
              <strong>
                {nextCustomer?.name ?? "Cliente"}
              </strong>

              <span>
                {nextService?.name ?? "Serviço"}
              </span>
            </div>

            <div className="admin-next-value">
              <strong>
                R${" "}
                {Number(nextAppointment.price ?? 0)
                  .toFixed(2)
                  .replace(".", ",")}
              </strong>

              <span
                className={`admin-status ${nextAppointment.status}`}
              >
                {nextAppointment.status === "confirmed"
                  ? "Confirmado"
                  : "Pendente"}
              </span>
            </div>
          </div>
        )}

        {/* =========================
            AGENDA DO DIA
        ========================= */}

        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="eyebrow">
                AGENDA
              </p>

              <h2>
                Agendamentos de hoje
              </h2>
            </div>

            <span>
              {new Date().toLocaleDateString("pt-BR", {
                timeZone: "America/Fortaleza",
              })}
            </span>
          </div>

          {appointments && appointments.length > 0 ? (
            <div className="admin-appointments">
              {appointments.map((appointment) => {
                const service = Array.isArray(
                  appointment.services
                )
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
                        {Number(appointment.price ?? 0)
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

              <strong>
                Nenhum agendamento hoje
              </strong>

              <p>
                Quando houver novos agendamentos,
                eles aparecerão aqui.
              </p>
            </div>
          )}
        </div>

        {/* =========================
            ACESSO RÁPIDO
        ========================= */}

        <aside className="admin-sidebar">
          <div className="admin-card">
            <p className="eyebrow">
              ACESSO RÁPIDO
            </p>

            <h2>
              Gerenciar
            </h2>

            <div className="admin-menu">
              <a href="/admin/agenda">
                📅 Agenda
              </a>

              <a href="/admin/clientes">
                👥 Clientes
              </a>

              <a href="/admin/servicos">
                ✂️ Serviços
              </a>

              <a href="/admin/horarios">
                🕐 Horários
              </a>

              <a href="/admin/financeiro">
                💰 Financeiro
              </a>
            </div>
          </div>
        </aside>

      </section>
    </main>
  );
}
