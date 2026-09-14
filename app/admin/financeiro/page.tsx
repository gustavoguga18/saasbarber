import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";
import PaymentAction from "./payment-action";

function money(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
  }).replace(".", "");
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
  }).replace(".", "");
}

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
        id,
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

  function getPayment(appointment: (typeof allAppointments)[number]) {
    return Array.isArray(appointment.payments)
      ? appointment.payments[0]
      : appointment.payments;
  }

  function isPaid(
    appointment: (typeof allAppointments)[number]
  ) {
    return getPayment(appointment)?.status === "paid";
  }

  function paymentValue(
    appointment: (typeof allAppointments)[number]
  ) {
    const payment = getPayment(appointment);

    return Number(
      payment?.amount ?? appointment.price ?? 0
    );
  }

  const paidAppointments = allAppointments.filter(isPaid);

  const paidValue = paidAppointments.reduce(
    (total, appointment) =>
      total + paymentValue(appointment),
    0
  );

  const pendingPaymentsValue = allAppointments.reduce(
    (total, appointment) => {
      const payment = getPayment(appointment);

      if (
        appointment.status !== "confirmed" ||
        payment?.status !== "pending"
      ) {
        return total;
      }

      return (
        total +
        Number(payment.amount ?? appointment.price ?? 0)
      );
    },
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

  /*
   * ==========================================
   * PERÍODOS FINANCEIROS
   * ==========================================
   */

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const todayString = getDateString(today);

  const currentWeekStart = startOfWeek(today);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(
    previousWeekStart.getDate() - 7
  );

  const currentMonthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const previousMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );

  const nextMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  function totalBetween(
    start: Date,
    end: Date
  ) {
    return paidAppointments.reduce(
      (total, appointment) => {
        const appointmentDate = parseDate(
          appointment.appointment_date
        );

        if (
          appointmentDate >= start &&
          appointmentDate < end
        ) {
          return total + paymentValue(appointment);
        }

        return total;
      },
      0
    );
  }

  /*
   * HOJE
   */

  const todayValue = paidAppointments.reduce(
    (total, appointment) => {
      if (
        appointment.appointment_date !==
        todayString
      ) {
        return total;
      }

      return total + paymentValue(appointment);
    },
    0
  );

  /*
   * SEMANA ATUAL
   */

  const currentWeekEnd = new Date(
    currentWeekStart
  );

  currentWeekEnd.setDate(
    currentWeekEnd.getDate() + 7
  );

  const currentWeekValue = totalBetween(
    currentWeekStart,
    currentWeekEnd
  );

  /*
   * SEMANA ANTERIOR
   */

  const previousWeekValue = totalBetween(
    previousWeekStart,
    currentWeekStart
  );

  /*
   * MÊS ATUAL
   */

  const currentMonthValue = totalBetween(
    currentMonthStart,
    nextMonthStart
  );

  /*
   * MÊS ANTERIOR
   */

  const previousMonthValue = totalBetween(
    previousMonthStart,
    currentMonthStart
  );

  function percentageChange(
    current: number,
    previous: number
  ) {
    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }

    return ((current - previous) / previous) * 100;
  }

  const weekChange = percentageChange(
    currentWeekValue,
    previousWeekValue
  );

  const monthChange = percentageChange(
    currentMonthValue,
    previousMonthValue
  );

  /*
   * ==========================================
   * ÚLTIMOS 7 DIAS
   * ==========================================
   */

  const dailyData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(date.getDate() - i);

    const dateString = getDateString(date);

    const value = paidAppointments.reduce(
      (total, appointment) => {
        if (
          appointment.appointment_date !==
          dateString
        ) {
          return total;
        }

        return total + paymentValue(appointment);
      },
      0
    );

    dailyData.push({
      date: dateString,
      label: formatDay(date),
      value,
    });
  }

  const bestDay = dailyData.reduce(
    (best, current) =>
      current.value > best.value
        ? current
        : best,
    dailyData[0]
  );

  /*
   * ==========================================
   * ÚLTIMAS 4 SEMANAS
   * ==========================================
   */

  const weeklyData = [];

  for (let i = 3; i >= 0; i--) {
    const start = new Date(
      currentWeekStart
    );

    start.setDate(
      start.getDate() - i * 7
    );

    const end = new Date(start);

    end.setDate(
      end.getDate() + 7
    );

    const value = totalBetween(
      start,
      end
    );

    weeklyData.push({
      label:
        i === 0
          ? "Esta semana"
          : i === 1
            ? "Semana passada"
            : `${i + 1} sem. atrás`,
      value,
    });
  }

  /*
   * ==========================================
   * ÚLTIMOS 6 MESES
   * ==========================================
   */

  const monthlyData = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    const end = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      1
    );

    const value = totalBetween(
      start,
      end
    );

    monthlyData.push({
      label: formatMonth(start),
      value,
    });
  }

  const maxDailyValue = Math.max(
    ...dailyData.map((item) => item.value),
    1
  );

  const maxWeeklyValue = Math.max(
    ...weeklyData.map((item) => item.value),
    1
  );

  const maxMonthlyValue = Math.max(
    ...monthlyData.map((item) => item.value),
    1
  );

  const paidCount = paidAppointments.length;

  const averageTicket =
    paidCount > 0
      ? paidValue / paidCount
      : 0;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">FINANCEIRO</p>

          <h1>Financeiro</h1>

          <p>
            Acompanhe os recebimentos e o desempenho
            financeiro da barbearia.
          </p>
        </div>
      </header>

      {error ? (
        <section className="admin-card">
          <div className="admin-empty">
            <span>⚠️</span>

            <strong>
              Não foi possível carregar os dados
              financeiros.
            </strong>

            <p>
              Tente novamente mais tarde.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* =========================
              RESUMO PRINCIPAL
          ========================= */}

          <section className="admin-stats">
            <div className="admin-stat-card">
              <span>Hoje</span>

              <strong>
                {money(todayValue)}
              </strong>

              <small>
                Pagamentos recebidos hoje
              </small>
            </div>

            <div className="admin-stat-card">
              <span>Esta semana</span>

              <strong>
                {money(currentWeekValue)}
              </strong>

              <small>
                {weekChange >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(weekChange).toFixed(1)}%
                {" "}vs. semana anterior
              </small>
            </div>

            <div className="admin-stat-card">
              <span>Este mês</span>

              <strong>
                {money(currentMonthValue)}
              </strong>

              <small>
                {monthChange >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(monthChange).toFixed(1)}%
                {" "}vs. mês anterior
              </small>
            </div>

            <div className="admin-stat-card">
              <span>Total recebido</span>

              <strong>
                {money(paidValue)}
              </strong>

              <small>
                {paidCount} pagamento
                {paidCount === 1 ? "" : "s"} realizado
                {paidCount === 1 ? "" : "s"}
              </small>
            </div>
          </section>

          {/* =========================
              DESTAQUES
          ========================= */}

          <section className="finance-highlights">
            <div className="finance-highlight">
              <span>Ticket médio</span>

              <strong>
                {money(averageTicket)}
              </strong>

              <small>
                Média por pagamento recebido
              </small>
            </div>

            <div className="finance-highlight">
              <span>Melhor dia dos últimos 7 dias</span>

              <strong>
                {bestDay?.label ?? "-"}
              </strong>

              <small>
                {money(bestDay?.value ?? 0)}
              </small>
            </div>

            <div className="finance-highlight">
              <span>Pagamentos pendentes</span>

              <strong>
                {money(pendingPaymentsValue)}
              </strong>

              <small>
                Aguardando recebimento
              </small>
            </div>

            <div className="finance-highlight">
              <span>Cancelados</span>

              <strong>
                {money(cancelledValue)}
              </strong>

              <small>
                {cancelledAppointments.length}{" "}
                agendamento
                {cancelledAppointments.length === 1
                  ? ""
                  : "s"}
              </small>
            </div>
          </section>

          {/* =========================
              ÚLTIMOS 7 DIAS
          ========================= */}

          <section className="admin-card finance-chart-card">
            <div className="admin-card-header">
              <div>
                <p className="eyebrow">
                  DESEMPENHO
                </p>

                <h2>
                  Últimos 7 dias
                </h2>
              </div>

              <span>
                {money(
                  dailyData.reduce(
                    (total, item) =>
                      total + item.value,
                    0
                  )
                )}
              </span>
            </div>

            <div className="finance-chart">
              {dailyData.map((item) => {
                const height =
                  item.value === 0
                    ? 4
                    : Math.max(
                        8,
                        (item.value /
                          maxDailyValue) *
                          100
                      );

                return (
                  <div
                    className="finance-chart-column"
                    key={item.date}
                  >
                    <div className="finance-chart-value">
                      {item.value > 0
                        ? money(item.value)
                        : "R$ 0"}
                    </div>

                    <div className="finance-chart-bar-wrapper">
                      <div
                        className="finance-chart-bar"
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <span>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =========================
              SEMANAS E MESES
          ========================= */}

          <div className="finance-comparison-grid">
            <section className="admin-card">
              <div className="admin-card-header">
                <div>
                  <p className="eyebrow">
                    COMPARAÇÃO
                  </p>

                  <h2>
                    Últimas 4 semanas
                  </h2>
                </div>
              </div>

              <div className="finance-simple-chart">
                {weeklyData.map(
                  (item, index) => {
                    const width =
                      item.value === 0
                        ? 0
                        : Math.max(
                            5,
                            (item.value /
                              maxWeeklyValue) *
                              100
                          );

                    return (
                      <div
                        className="finance-horizontal-row"
                        key={`${item.label}-${index}`}
                      >
                        <div className="finance-horizontal-label">
                          <span>
                            {item.label}
                          </span>

                          <strong>
                            {money(item.value)}
                          </strong>
                        </div>

                        <div className="finance-horizontal-track">
                          <div
                            className="finance-horizontal-bar"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-card-header">
                <div>
                  <p className="eyebrow">
                    COMPARAÇÃO
                  </p>

                  <h2>
                    Últimos 6 meses
                  </h2>
                </div>
              </div>

              <div className="finance-simple-chart">
                {monthlyData.map(
                  (item, index) => {
                    const width =
                      item.value === 0
                        ? 0
                        : Math.max(
                            5,
                            (item.value /
                              maxMonthlyValue) *
                              100
                          );

                    return (
                      <div
                        className="finance-horizontal-row"
                        key={`${item.label}-${index}`}
                      >
                        <div className="finance-horizontal-label">
                          <span>
                            {item.label}
                          </span>

                          <strong>
                            {money(item.value)}
                          </strong>
                        </div>

                        <div className="finance-horizontal-track">
                          <div
                            className="finance-horizontal-bar"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </div>

          {/* =========================
              COMPARATIVO
          ========================= */}

          <section className="finance-period-comparison">
            <div>
              <span>
                Semana atual
              </span>

              <strong>
                {money(currentWeekValue)}
              </strong>

              <small>
                {weekChange >= 0
                  ? "↑ crescimento"
                  : "↓ queda"}{" "}
                de{" "}
                {Math.abs(
                  weekChange
                ).toFixed(1)}
                %
              </small>
            </div>

            <div className="finance-comparison-divider">
              ×
            </div>

            <div>
              <span>
                Semana anterior
              </span>

              <strong>
                {money(previousWeekValue)}
              </strong>

              <small>
                Período anterior
              </small>
            </div>

            <div className="finance-period-month">
              <span>
                Mês atual
              </span>

              <strong>
                {money(currentMonthValue)}
              </strong>

              <small>
                {monthChange >= 0
                  ? "↑ crescimento"
                  : "↓ queda"}{" "}
                de{" "}
                {Math.abs(
                  monthChange
                ).toFixed(1)}
                %
              </small>
            </div>

            <div className="finance-comparison-divider">
              ×
            </div>

            <div>
              <span>
                Mês anterior
              </span>

              <strong>
                {money(previousMonthValue)}
              </strong>

              <small>
                Período anterior
              </small>
            </div>
          </section>

          {/* =========================
              OUTROS VALORES
          ========================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="eyebrow">
                  RESUMO
                </p>

                <h2>
                  Situação financeira
                </h2>
              </div>
            </div>

            <div className="finance-summary-grid">
              <div>
                <span>
                  Recebidos
                </span>

                <strong>
                  {money(paidValue)}
                </strong>
              </div>

              <div>
                <span>
                  Pagamentos pendentes
                </span>

                <strong>
                  {money(pendingPaymentsValue)}
                </strong>
              </div>

              <div>
                <span>
                  Agendamentos pendentes
                </span>

                <strong>
                  {money(pendingValue)}
                </strong>
              </div>

              <div>
                <span>
                  Cancelados
                </span>

                <strong>
                  {money(cancelledValue)}
                </strong>
              </div>
            </div>
          </section>

          {/* =========================
              AGENDAMENTOS
          ========================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="eyebrow">
                  DETALHAMENTO
                </p>

                <h2>
                  Agendamentos
                </h2>
              </div>

              <span>
                {allAppointments.length}{" "}
                registro
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
                  Os valores aparecerão aqui
                  conforme os agendamentos forem
                  realizados.
                </p>
              </div>
            ) : (
              <div className="admin-appointments">
                {allAppointments.map(
                  (appointment) => {
                    const customer =
                      Array.isArray(
                        appointment.customers
                      )
                        ? appointment.customers[0]
                        : appointment.customers;

                    const service =
                      Array.isArray(
                        appointment.services
                      )
                        ? appointment.services[0]
                        : appointment.services;

                    const payment =
                      getPayment(appointment);

                    return (
                      <div
                        className="admin-appointment"
                        key={appointment.id}
                      >
                        <div className="admin-time">
                          {appointment.start_time?.slice(
                            0,
                            5
                          )}
                        </div>

                        <div className="admin-appointment-info">
                          <strong>
                            {customer?.name ??
                              "Cliente não informado"}
                          </strong>

                          <span>
                            📅{" "}
                            {
                              appointment.appointment_date
                            }
                          </span>

                          <span>
                            ✂️{" "}
                            {service?.name ??
                              "Serviço não informado"}
                          </span>

                          <small>
                            💳{" "}
                            {payment?.method ===
                            "pix"
                              ? "PIX"
                              : payment?.method ===
                                  "credit"
                                ? "Cartão de crédito"
                                : payment?.method ===
                                    "debit"
                                  ? "Cartão de débito"
                                  : payment?.method ===
                                      "cash"
                                    ? "Espécie"
                                    : "Não informado"}
                          </small>

                          {payment?.status ===
                            "paid" && (
                            <small className="payment-paid">
                              ✓ Pago
                            </small>
                          )}
                        </div>

                        <div className="admin-appointment-right">
                          <strong>
                            {money(
                              Number(
                                appointment.price ??
                                  0
                              )
                            )}
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

                          {payment?.id &&
                            appointment.status ===
                              "confirmed" &&
                            payment.status !==
                              "paid" && (
                              <PaymentAction
                                paymentId={
                                  payment.id
                                }
                              />
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
