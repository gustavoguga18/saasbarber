import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BookingForm } from "./booking-form";

export default async function AgendarPage() {
  const supabase = await createServerSupabaseClient();
  const { data: services } = await supabase
    .from("services")
    .select("id,name,description,price,duration_minutes")
    .eq("active", true)
    .order("name");

  return (
    <main className="page narrow">
      <h1>Agendar horário</h1>
      <p>Escolha o serviço e informe seus dados.</p>
      <BookingForm services={services ?? []} />
    </main>
  );
}