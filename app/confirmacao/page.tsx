import Link from "next/link";
import { createAdminClient } from "@/lib/admin";

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

  const supabase = createAdminClient();

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
  ),
  customers (
    name,
    phone
  )
`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar agendamento:", error);
  }

  if (!appointment) {
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
  const customer = Array.isArray(appointment.customers)
  ? appointment.customers[0]
  : appointment.customers;

const phone = customer?.phone?.replace(/\D/g, "");

const whatsappMessage = encodeURIComponent(
  `Olá, ${customer?.name ?? "cliente"}! 💈

Seu agendamento na Yago Barbershop foi recebido!

✂️ Serviço: ${service?.name ?? "Serviço"}
📅 Data: ${appointment.appointment_date}
🕐 Horário: ${appointment.start_time?.slice(0, 5)}
💰 Valor: R$ ${Number(appointment.price).toFixed(2).replace(".", ",")}

Aguardamos você! 💈

📍 Rua Bom Jesus, 957`
);

const whatsappUrl = phone
  ? `https://wa.me/55${phone}?text=${whatsappMessage}`
  : null;

  const statusText =
    appointment.status === "pending"
      ? "Aguardando confirmação"
      : appointment.status === "confirmed"
        ? "Confirmado"
        : appointment.status;

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
            {statusText}
          </p>
        </div>

        <p>
          Em breve entraremos em contato para confirmar seu horário.
        </p>
{whatsappUrl && (
  <a
    href={whatsappUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="button"
  >
    📲 Enviar confirmação pelo WhatsApp
  </a>
)}
        <Link href="/agendar" className="button">
          Fazer novo agendamento
        </Link>
      </div>
    </main>
  );
}
