import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function Confirmacao({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data } = id
    ? await supabase.from("appointments").select("appointment_date,start_time,status").eq("id", id).single()
    : { data: null };

  return (
    <main className="page narrow">
      <div className="card">
        <h1>Agendamento recebido</h1>
        {data ? (
          <>
            <p>Data: {data.appointment_date}</p>
            <p>Horário: {data.start_time.slice(0,5)}</p>
            <p>Status: {data.status}</p>
          </>
        ) : <p>Não foi possível localizar o agendamento.</p>}
      </div>
    </main>
  );
}