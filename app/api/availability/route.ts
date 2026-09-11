import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

function getWorkingHours(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  // 0 = domingo
  const weekday = new Date(year, month - 1, day).getDay();

  if (weekday === 0) {
    return null;
  }

  if (weekday >= 1 && weekday <= 4) {
    return {
      start: 9 * 60,
      end: 19 * 60,
    };
  }

  if (weekday === 5 || weekday === 6) {
    return {
      start: 9 * 60,
      end: 20 * 60,
    };
  }

  return null;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:00`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: "Serviço e data são obrigatórios." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: service, error: serviceError } = await admin
      .from("services")
      .select("id,duration_minutes,establishment_id")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Serviço inválido." },
        { status: 400 }
      );
    }

    const workingHours = getWorkingHours(date);

    if (!workingHours) {
      return NextResponse.json({ slots: [] });
    }

    const { data: appointments, error: appointmentsError } = await admin
      .from("appointments")
      .select("start_time,end_time")
      .eq("establishment_id", service.establishment_id)
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed"]);

    if (appointmentsError) {
      console.error(
        "Erro ao buscar agendamentos:",
        appointmentsError
      );

      return NextResponse.json(
        { error: "Não foi possível consultar os horários." },
        { status: 500 }
      );
    }

    const now = new Date();

    const fortalezaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Fortaleza",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const fortalezaTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Fortaleza",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const isToday = date === fortalezaDate;

    let minimumTime = workingHours.start;

    if (isToday) {
      const [currentHour, currentMinute] = fortalezaTime
        .split(":")
        .map(Number);

      const currentTotal =
        currentHour * 60 + currentMinute;

      minimumTime =
        Math.ceil(currentTotal / 30) * 30;
    }

    const slots: string[] = [];

    for (
      let start = workingHours.start;
      start + Number(service.duration_minutes) <= workingHours.end;
      start += 30
    ) {
      if (start < minimumTime) {
        continue;
      }

      const end =
        start + Number(service.duration_minutes);

      const startTime = minutesToTime(start);
      const endTime = minutesToTime(end);

      const hasConflict = appointments?.some((appointment) => {
        return (
          appointment.start_time < endTime &&
          appointment.end_time > startTime
        );
      });

      if (!hasConflict) {
        slots.push(startTime.slice(0, 5));
      }
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Erro interno:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
