import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, date, time, name, phone } = body;

    if (!serviceId || !date || !time || !name || !phone) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: service, error: serviceError } = await admin
      .from("services")
      .select("id,price,duration_minutes,establishment_id")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
    }

    const { data: existing } = await admin
      .from("appointments")
      .select("id")
      .eq("establishment_id", service.establishment_id)
      .eq("appointment_date", date)
      .eq("start_time", time)
      .in("status", ["pending", "confirmed"])
      .limit(1);

    if (existing?.length) {
      return NextResponse.json({ error: "Esse horário já está ocupado." }, { status: 409 });
    }

    const { data: customer, error: customerError } = await admin
      .from("customers")
      .upsert(
        { establishment_id: service.establishment_id, name: String(name).trim(), phone: String(phone).trim() },
        { onConflict: "establishment_id,phone" }
      )
      .select("id")
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Não foi possível cadastrar o cliente." }, { status: 500 });
    }

    const [h, m] = String(time).split(":").map(Number);
    const total = h * 60 + m + Number(service.duration_minutes);
    const endTime = `${String(Math.floor(total / 60) % 24).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}:00`;

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
      return NextResponse.json({ error: "Não foi possível criar o agendamento." }, { status: 500 });
    }

    return NextResponse.json({ id: appointment.id });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}