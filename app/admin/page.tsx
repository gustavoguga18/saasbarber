import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") redirect("/login");

  const today = new Date().toISOString().slice(0,10);
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id,appointment_date,start_time,status,customer_id,service_id")
    .eq("appointment_date", today)
    .order("start_time");

  return (
    <main className="page">
      <h1>Painel administrativo</h1>
      <div className="grid">
        <div className="card"><h2>Hoje</h2><strong>{appointments?.length ?? 0}</strong><p>agendamentos</p></div>
        <div className="card"><h2>Status</h2><p>Login protegido pelo Supabase Auth.</p></div>
      </div>
      <div className="card">
        <h2>Agenda de hoje</h2>
        {appointments?.length ? appointments.map(a => (
          <div className="row" key={a.id}>
            <span>{a.start_time.slice(0,5)}</span>
            <span>{a.status}</span>
          </div>
        )) : <p>Nenhum agendamento para hoje.</p>}
      </div>
    </main>
  );
}