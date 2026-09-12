import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export default async function ConfiguracoesPage() {
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

  const { data: establishment, error } = await admin
    .from("establishments")
    .select("*")
    .eq("id", profile.establishment_id)
    .single();

  if (error || !establishment) {
    return (
      <main className="admin-page">
        <a href="/admin" className="admin-back-button">
          ← Voltar
        </a>

        <div className="admin-card">
          <p className="error">
            Não foi possível carregar as configurações.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <a href="/admin" className="admin-back-button">
            ← Voltar
          </a>

          <p className="eyebrow">CONFIGURAÇÕES</p>

          <h1>Configurações</h1>

          <p>
            Gerencie as informações da sua barbearia.
          </p>
        </div>
      </header>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <p className="eyebrow">ESTABELECIMENTO</p>

            <h2>Informações da barbearia</h2>
          </div>
        </div>

        <div className="admin-empty">
          <span>⚙️</span>

          <strong>{establishment.name}</strong>

          <p>
            As configurações da barbearia serão disponibilizadas
            aqui.
          </p>
        </div>
      </section>
    </main>
  );
}
