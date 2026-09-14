import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BookingForm } from "./booking-form";

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: services } = await supabase
    .from("services")
    .select("id,name,description,price,duration_minutes")
    .eq("active", true)
    .order("name");

  const params = await searchParams;
  const adminMode = params.admin === "true";

  return (
    <main className="page narrow">
      <h1>{adminMode ? "Agendamento manual" : "Agendar horário"}</h1>

      <p>
        {adminMode
          ? "Preencha os dados do cliente para reservar este horário."
          : "Escolha o serviço e informe seus dados."}
      </p>

      <BookingForm
        services={services ?? []}
        adminMode={adminMode}
      />
    </main>
  );
}
