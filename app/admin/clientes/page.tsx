import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export default async function ClientesPage() {
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

  const { data: customers, error } = await admin
    .from("customers")
    .select("id, name, phone, email, created_at")
    .eq("establishment_id", profile.establishment_id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar clientes:", error);
  }

  const customerIds = (customers ?? []).map((customer) => customer.id);

let appointmentCounts: Record<string, number> = {};
let customerAppointments: Record<string, any[]> = {};

if (customerIds.length > 0) {
  const { data: appointments } = await admin
    .from("appointments")
    .select(`
      id,
      customer_id,
      appointment_date,
      start_time,
      status,
      services (
        name,
        price
      )
    `)
    .in("customer_id", customerIds)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  appointmentCounts = (appointments ?? []).reduce(
    (acc, appointment) => {
      acc[appointment.customer_id] =
        (acc[appointment.customer_id] ?? 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  customerAppointments = (appointments ?? []).reduce(
    (acc, appointment) => {
      if (!acc[appointment.customer_id]) {
        acc[appointment.customer_id] = [];
      }

      acc[appointment.customer_id].push(appointment);

      return acc;
    },
    {} as Record<string, any[]>
  );
}
  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <a href="/admin" className="admin-back-button">
            ← Voltar
          </a>

          <p className="eyebrow">CLIENTES</p>

          <h1>Clientes</h1>

          <p>
            Clientes cadastrados através dos agendamentos.
          </p>
        </div>
      </header>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">CADASTRO</p>
            <h2>Lista de clientes</h2>
          </div>

          <span>
            {(customers ?? []).length} cliente
            {(customers ?? []).length === 1 ? "" : "s"}
          </span>
        </div>

        {error ? (
          <div className="admin-empty">
            <span>⚠️</span>
            <strong>Não foi possível carregar os clientes.</strong>
            <p>Tente novamente mais tarde.</p>
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="admin-empty">
            <span>👥</span>
            <strong>Nenhum cliente cadastrado.</strong>
            <p>
              Os clientes aparecerão aqui quando fizerem um agendamento.
            </p>
          </div>
        ) : (
          <div className="admin-appointments">
            {customers.map((customer) => (
              <div className="admin-appointment" key={customer.id}>
                <div className="admin-time">👤</div>

                <div className="admin-appointment-info">
                  <strong>{customer.name}</strong>

                  <span>📱 {customer.phone}</span>

                  {customer.email && (
                    <span>✉️ {customer.email}</span>
                  )}

                  <small>
                    {appointmentCounts[customer.id] ?? 0}{" "}
                    agendamento
                    {(appointmentCounts[customer.id] ?? 0) === 1
                      ? ""
                      : "s"}
                  </small>
                </div>

                <div className="admin-appointment-right">
                  <a
                    href={`https://wa.me/55${customer.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
