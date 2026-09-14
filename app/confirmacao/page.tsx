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
      <main className="page narrow">
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
      <main className="page narrow">
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

  // Número fixo do WhatsApp do barbeiro
  const barberPhone = "5585986391263";

  const statusText =
    appointment.status === "pending"
      ? "Aguardando confirmação"
      : appointment.status === "confirmed"
        ? "Confirmado"
        : appointment.status;

  const whatsappMessage = encodeURIComponent(
    `\u{1F514} Novo agendamento recebido!

\u{1F464} Cliente: ${customer?.name ?? "Cliente"}
\u{2702}\u{FE0F} Serviço: ${service?.name ?? "Serviço"}
\u{1F4C5} Data: ${appointment.appointment_date}
\u{1F552} Horário: ${appointment.start_time?.slice(0, 5)}
\u{1F4B0} Valor: R$ ${Number(appointment.price)
      .toFixed(2)
      .replace(".", ",")}

\u{1F4CC} Status: ${statusText}

\u{1F4CD} Rua Bom Jesus, 957`
  );

  const whatsappUrl =
    `https://wa.me/${barberPhone}?text=${whatsappMessage}`;

  return (
    <main className="page narrow">
      <div className="card confirmation-card">
        <div className="confirmation-icon">✓</div>

        <p className="eyebrow">YAGO BARBERSHOP</p>

        <h1>Agendamento recebido!</h1>

        <p>
          Seu pedido de agendamento foi registrado com sucesso.
        </p>

        <div className="appointment-details">
          <div className="confirmation-row">
            <span>Serviço</span>
            <strong>{service?.name ?? "Serviço"}</strong>
          </div>

          <div className="confirmation-row">
            <span>Data</span>
            <strong>{appointment.appointment_date}</strong>
          </div>

          <div className="confirmation-row">
            <span>Horário</span>
            <strong>{appointment.start_time?.slice(0, 5)}</strong>
          </div>

          <div className="confirmation-row">
            <span>Valor</span>
            <strong>
              R$ {Number(appointment.price).toFixed(2).replace(".", ",")}
            </strong>
          </div>

          <div className="confirmation-row">
            <span>Status</span>
            <strong className="status">
              {statusText}
            </strong>
          </div>
        </div>

        <p className="confirmation-message">
          Em breve entraremos em contato para confirmar seu horário.
        </p>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button whatsapp-button"
          >
            📲 Enviar confirmação pelo WhatsApp
          </a>
        )}

        <Link href="/agendar" className="button secondary-button">
          Fazer novo agendamento
        </Link>
      </div>
    </main>
  );
}
