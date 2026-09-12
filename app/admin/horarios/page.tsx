import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";
import WorkingHoursForm from "./working-hours-form";
import BlockedDatesForm from "./blocked-dates-form";

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

  const { data: blockedDates, error: blockedDatesError } = await admin
    .from("blocked_dates")
    .select("id, blocked_date, reason")
    .eq("establishment_id", profile.establishment_id)
    .order("blocked_date", { ascending: true });

  if (blockedDatesError) {
    console.error(
      "Erro ao buscar dias bloqueados:",
      blockedDatesError
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
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
          <WorkingHoursForm
            workingHours={workingHours ?? []}
          />
        )}
      </section>

      <section className="admin-card blocked-dates-card">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">EXCEÇÕES</p>
            <h2>Dias fechados</h2>

            <p>
              Feche a barbearia em um dia específico ou durante um período.
            </p>
          </div>
        </div>

        <BlockedDatesForm
          blockedDates={blockedDates ?? []}
        />
      </section>
    </main>
  );
}
