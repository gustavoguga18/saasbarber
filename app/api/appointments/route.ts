import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
  serviceId,
  date,
  time,
  name,
  phone,
  paymentMethod,
} = body;

    console.log("Método de pagamento recebido:", paymentMethod);
    
if (!serviceId || !date || !time || !name || !phone || !paymentMethod) {
  return NextResponse.json(
    { error: "Preencha todos os campos." },
    { status: 400 }
  );
}

if (!["pix", "card", "cash"].includes(paymentMethod)) {
  return NextResponse.json(
    { error: "Forma de pagamento inválida." },
    { status: 400 }
  );
}

const admin = createAdminClient();

    const { data: service, error: serviceError } = await admin
      .from("services")
      .select("id,name,price,duration_minutes,establishment_id")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Serviço inválido." },
        { status: 400 }
      );
    }

   const [h, m] = String(time).split(":").map(Number);

const total =
  h * 60 + m + Number(service.duration_minutes);

const endTime = `${String(Math.floor(total / 60) % 24).padStart(
  2,
  "0"
)}:${String(total % 60).padStart(2, "0")}:00`;

const { data: existing } = await admin
  .from("appointments")
  .select("id,start_time,end_time")
  .eq("establishment_id", service.establishment_id)
  .eq("appointment_date", date)
  .in("status", ["pending", "confirmed"])
  .lt("start_time", endTime)
  .gt("end_time", `${time}:00`)
  .limit(1);

if (existing?.length) {
  return NextResponse.json(
    { error: "Esse horário está dentro de outro agendamento." },
    { status: 409 }
  );
}

    const { data: customer, error: customerError } = await admin
      .from("customers")
      .upsert(
        {
          establishment_id: service.establishment_id,
          name: String(name).trim(),
          phone: String(phone).trim(),
        },
        { onConflict: "establishment_id,phone" }
      )
      .select("id")
      .single();

    if (customerError || !customer) {
      console.error("Erro ao cadastrar cliente:", customerError);

      return NextResponse.json(
        { error: "Não foi possível cadastrar o cliente." },
        { status: 500 }
      );
    }


    const { data: appointment, error } = await admin
      .from("appointments")
      .insert({
        establishment_id: service.establishment_id,
        service_id: service.id,
        customer_id: customer.id,
        appointment_date: date,
        start_time: `${time}:00`,
        end_time: endTime,
        status: "pending",
        price: service.price,
      })
      .select("id")
      .single();

    if (error || !appointment) {
  if (error?.code === "23505") {
    return NextResponse.json(
      { error: "Esse horário já está ocupado." },
      { status: 409 }
    );
  }

  console.error("Erro ao criar agendamento:", error);

  return NextResponse.json(
    { error: "Não foi possível criar o agendamento." },
    { status: 500 }
  );
}
const { error: paymentError } = await admin
  .from("payments")
  .insert({
    appointment_id: appointment.id,
    amount: service.price,
    method: paymentMethod,
    status: "pending",
  });

if (paymentError) {
  console.error("Erro ao registrar pagamento:", paymentError);

  return NextResponse.json(
    { error: "Não foi possível registrar a forma de pagamento." },
    { status: 500 }
  );
}
    /*
     * E-MAIL PARA O ADMINISTRADOR
     */
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "gustavobarbosagbn@gmail.com",
        subject: "🔔 Novo agendamento - Yago Barbershop",
        html: `
          <h2>Novo agendamento! 💈</h2>

          <p>
            <strong>Cliente:</strong>
            ${String(name).trim()}
          </p>

          <p>
            <strong>WhatsApp:</strong>
            ${String(phone).trim()}
          </p>

          <p>
            <strong>Serviço:</strong>
            ${service.name}
          </p>

          <p>
            <strong>Data:</strong>
            ${date}
          </p>

          <p>
            <strong>Horário:</strong>
            ${String(time).slice(0, 5)}
          </p>

          <p>
            <strong>Valor:</strong>
            R$ ${Number(service.price).toFixed(2).replace(".", ",")}
          </p>

          <p>
            <strong>Status:</strong>
            Aguardando confirmação
          </p>
        `,
      });
    } catch (emailError) {
      console.error(
        "Erro ao enviar e-mail para o administrador:",
        emailError
      );
    }

    return NextResponse.json({ id: appointment.id });
  } catch (error) {
    console.error("Erro interno:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
