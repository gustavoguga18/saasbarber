import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    return (
      <main className="container">
        <div className="card">
          <h1>Agendamento recebido</h1>
          <p>Não foi possível localizar o agendamento.</p>
          <Link href="/agendar" className="button">
            Fazer novo agendamento
          </Link>
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Não precisamos alterar cookies nesta página.
        },
      },
    }
  );

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      status,
      price,
      services (
        name
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !appointment) {
    console.error("Erro ao localizar agendamento:", error);

    return (
      <main className="container">
        <div className="card">
          <h1>Agendamento recebido</h1>
          <p>Não foi possível localizar o agendamento.</p>

          <Link href="/agendar" className="button">
            Fazer novo agendamento
          </Link>
        </div>
      </main>
    );
  }

  const service = Array.isArray(appointment.services)
    ? appointment.services[0]
    : appointment.services;

  return (
    <main className="container">
      <div className="card">
        <h1>Agendamento recebido! ✅</h1>

        <p>
          Seu pedido de agendamento foi registrado com sucesso.
        </p>

        <div className="appointment-details">
          <p>
            <strong>Serviço:</strong>{" "}
            {service?.name ?? "Serviço"}
          </p>

          <p>
            <strong>Data:</strong>{" "}
            {appointment.appointment_date}
          </p>

          <p>
            <strong>Horário:</strong>{" "}
            {appointment.start_time?.slice(0, 5)}
          </p>

          <p>
            <strong>Valor:</strong>{" "}
            R$ {Number(appointment.price).toFixed(2).replace(".", ",")}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {appointment.status === "pending"
              ? "Aguardando confirmação"
              : appointment.status === "confirmed"
                ? "Confirmado"
                : appointment.status}
          </p>
        </div>

        <p>
          Em breve entraremos em contato para confirmar seu horário.
        </p>

        <Link href="/agendar" className="button">
          Fazer novo agendamento
        </Link>
      </div>
    </main>
  );
}
