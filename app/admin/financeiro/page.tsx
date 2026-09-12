import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export default async function FinanceiroPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("establishment_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.establishment_id) {
    return (
      <main className="admin-page">
        <a href="/admin" className="admin-back-button">
          ← Voltar
        </a>

        <div className="admin-card">
          <p className="error">
            Não foi possível identificar o estabelecimento.
          </p>
        </div>
      </main>
    );
  }

  const { data: appointments, error } = await admin
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      status,
      price,
      customers (
        name,
        phone
      ),
      services (
        name
      ),
      payments (
        amount,
        method,
        status,
        paid_at
      )
    `)
    .eq("establishment_id", profile.establishment_id)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Erro ao buscar dados financeiros:", error);
  }

  const allAppointments = appointments ?? [];

  const confirmedAppointments = allAppointments.filter(
    (appointment) => appointment.status === "confirmed"
  );

  const pendingAppointments = allAppointments.filter(
    (appointment) => appointment.status === "pending"
  );

  const cancelledAppointments = allAppointments.filter(
    (appointment) => appointment.status === "cancelled"
  );

  const confirmedValue = confirmedAppointments.reduce(
    (total, appointment) =>
      total + Number(appointment.price ?? 0),
    0
  );

  const pendingValue = pendingAppointments.reduce(
    (total, appointment) =>
      total + Number(appointment.price ?? 0),
    0
  );

  const cancelledValue = cancelledAppointments.reduce(
    (total, appointment) =>
      total + Number(appointment.price ?? 0),
    0
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <a href="/admin" className="admin-back-button">
            ← Voltar
          </a>

          <p className="eyebrow">FINANCEIRO</p>

          <h1>Financeiro</h1>

          <p>
            Acompanhe os valores dos agendamentos da barbearia.
          </p>
        </div>
      </header>

      {error ? (
        <section className="admin-card">
          <div className="admin-empty">
            <span>⚠️</span>

            <strong>
              Não foi possível carregar os dados financeiros.
            </strong>

            <p>Tente novamente mais tarde.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="admin-stats">
            <div className="admin-stat-card">
              <span>Confirmados</span>

              <strong>
                R${" "}
                {confirmedValue
                  .toFixed(2)
                  .replace(".", ",")}
              </strong>

              <small>
                {confirmedAppointments.length} agendamento
                {confirmedAppointments.length === 1
                  ? ""
                  : "s"}
              </small>
            </div>

            <div className="admin-stat-card">
              <span>Pendentes</span>

              <strong>
                R${" "}
                {pendingValue
                  .toFixed(2)
                  .replace(".", ",")}
              </strong>

              <small>
                {pendingAppointments.length} agendamento
                {pendingAppointments.length === 1
                  ? ""
                  : "s"}
              </small>
            </div>

            <div className="admin-stat-card">
              <span>Cancelados</span>

              <strong>
                R${" "}
                {cancelledValue
                  .toFixed(2)
                  .replace(".", ",")}
              </strong>

              <small>
                {cancelledAppointments.length} agendamento
                {cancelledAppointments.length === 1
                  ? ""
                  : "s"}
              </small>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="eyebrow">RESUMO</p>

                <h2>Agendamentos</h2>
              </div>

              <span>
                {allAppointments.length} registro
                {allAppointments.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            {allAppointments.length === 0 ? (
              <div className="admin-empty">
                <span>💰</span>

                <strong>
                  Nenhum registro financeiro.
                </strong>

                <p>
                  Os valores aparecerão aqui conforme os
                  agendamentos forem realizados.
                </p>
              </div>
            ) : (
              <div className="admin-appointments">
                {allAppointments.map((appointment) => {
                  const customer = Array.isArray(
                    appointment.customers
                  )
                    ? appointment.customers[0]
                    : appointment.customers;

                  const service = Array.isArray(
                    appointment.services
                  )
                    ? appointment.services[0]
                    : appointment.services;

                  const payment = Array.isArray(
                    appointment.payments
                  )
                    ? appointment.payments[0]
                    : appointment.payments;

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
                          {customer?.name ??
                            "Cliente não informado"}
                        </strong>

                        <span>
                          📅 {appointment.appointment_date}
                        </span>

                        <span>
                          ✂️{" "}
                          {service?.name ??
                            "Serviço não informado"}
                        </span>

                        <small>
                          💳{" "}
                          {payment?.method === "pix"
                            ? "PIX"
                            : payment?.method === "credit"
                            ? "Cartão de crédito"
                            : payment?.method === "debit"
                            ? "Cartão de débito"
                            : payment?.method === "cash"
                            ? "Espécie"
                            : "Não informado"}
                        </small>
                      </div>

                      <div className="admin-appointment-right">
                        <strong>
                          R${" "}
                          {Number(
                            appointment.price ?? 0
                          )
                            .toFixed(2)
                            .replace(".", ",")}
                        </strong>

                        <span
                          className={`admin-status ${
                            appointment.status
                          }`}
                        >
                          {appointment.status ===
                          "confirmed"
                            ? "Confirmado"
                            : appointment.status ===
                              "pending"
                            ? "Pendente"
                            : appointment.status ===
                              "cancelled"
                            ? "Cancelado"
                            : appointment.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
