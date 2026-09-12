import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export default async function HorariosPage() {
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

  const { data: workingHours, error } = await admin
    .from("working_hours")
    .select("id, weekday, open_time, close_time, active")
    .eq("establishment_id", profile.establishment_id)
    .order("weekday", { ascending: true });

  if (error) {
    console.error("Erro ao buscar horários:", error);
  }

  const days = [
    { value: 0, name: "Domingo" },
    { value: 1, name: "Segunda-feira" },
    { value: 2, name: "Terça-feira" },
    { value: 3, name: "Quarta-feira" },
    { value: 4, name: "Quinta-feira" },
    { value: 5, name: "Sexta-feira" },
    { value: 6, name: "Sábado" },
  ];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <a href="/admin" className="admin-back-button">
            ← Voltar
          </a>

          <p className="eyebrow">HORÁRIOS</p>

          <h1>Horários</h1>

          <p>
            Configure os dias e horários de funcionamento da barbearia.
          </p>
        </div>
      </header>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">FUNCIONAMENTO</p>
            <h2>Horários da semana</h2>
          </div>
        </div>

        {error ? (
          <div className="admin-empty">
            <span>⚠️</span>
            <strong>Não foi possível carregar os horários.</strong>
            <p>Tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="admin-appointments">
            {days.map((day) => {
              const schedule = workingHours?.find(
                (item) => item.weekday === day.value
              );

              return (
                <div className="admin-appointment" key={day.value}>
                  <div className="admin-time">📅</div>

                  <div className="admin-appointment-info">
                    <strong>{day.name}</strong>

                    {schedule?.active ? (
                      <span>
                        🟢 {schedule.open_time?.slice(0, 5)} às{" "}
                        {schedule.close_time?.slice(0, 5)}
                      </span>
                    ) : (
                      <span>🔴 Fechado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
