import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export default async function ServicosPage() {
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

  const { data: services, error } = await admin
    .from("services")
    .select("id, name, price, duration_minutes, active")
    .eq("establishment_id", profile.establishment_id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar serviços:", error);
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <a href="/admin" className="admin-back-button">
            ← Voltar
          </a>

          <p className="eyebrow">SERVIÇOS</p>

          <h1>Serviços</h1>

          <p>
            Gerencie os serviços oferecidos pela barbearia.
          </p>
        </div>
      </header>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">CATÁLOGO</p>
            <h2>Serviços cadastrados</h2>
          </div>

          <span>
            {(services ?? []).length} serviço
            {(services ?? []).length === 1 ? "" : "s"}
          </span>
        </div>

        {error ? (
          <div className="admin-empty">
            <span>⚠️</span>
            <strong>Não foi possível carregar os serviços.</strong>
            <p>Tente novamente mais tarde.</p>
          </div>
        ) : !services || services.length === 0 ? (
          <div className="admin-empty">
            <span>✂️</span>
            <strong>Nenhum serviço cadastrado.</strong>
            <p>
              Cadastre os serviços da barbearia para que eles apareçam
              no agendamento.
            </p>
          </div>
        ) : (
          <div className="admin-appointments">
            {services.map((service) => (
              <div className="admin-appointment" key={service.id}>
                <div className="admin-time">✂️</div>

                <div className="admin-appointment-info">
                  <strong>{service.name}</strong>

                  <span>
                    ⏱️ {service.duration_minutes} minutos
                  </span>

                  <small>
                    {service.active ? "🟢 Ativo" : "🔴 Inativo"}
                  </small>
                </div>

                <div className="admin-appointment-right">
                  <strong>
                    R${" "}
                    {Number(service.price)
                      .toFixed(2)
                      .replace(".", ",")}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
