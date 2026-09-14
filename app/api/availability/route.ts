import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

function getWeekday(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).getDay();
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:00`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
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

    // =========================================================
    // BUSCA O SERVIÇO
    // =========================================================

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

    // =========================================================
    // 1. VERIFICA SE A DATA ESTÁ TOTALMENTE BLOQUEADA
    // =========================================================

    const { data: blockedDate, error: blockedDateError } = await admin
      .from("blocked_dates")
      .select("id,reason")
      .eq("establishment_id", service.establishment_id)
      .eq("blocked_date", date)
      .maybeSingle();

    if (blockedDateError) {
      console.error(
        "Erro ao verificar data bloqueada:",
        blockedDateError
      );

      return NextResponse.json(
        { error: "Não foi possível consultar a disponibilidade." },
        { status: 500 }
      );
    }

    // Se estiver em blocked_dates, não existe nenhum horário.
    if (blockedDate) {
      return NextResponse.json({
        slots: [],
        closed: true,
        reason: blockedDate.reason ?? null,
      });
    }

    // =========================================================
    // 2. VERIFICA SE EXISTE HORÁRIO ESPECIAL PARA ESSA DATA
    // =========================================================

    const { data: specialHour, error: specialHourError } = await admin
      .from("special_hours")
      .select("open_time,close_time,reason")
      .eq("establishment_id", service.establishment_id)
      .eq("special_date", date)
      .maybeSingle();

    if (specialHourError) {
      console.error(
        "Erro ao verificar horário especial:",
        specialHourError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível consultar o horário especial."
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 3. DEFINE O HORÁRIO DE FUNCIONAMENTO
    // =========================================================

    let workingStart: number;
    let workingEnd: number;
    let specialReason: string | null = null;

    if (specialHour) {
      // Existe horário especial:
      // ele substitui o horário normal da semana.

      workingStart = timeToMinutes(specialHour.open_time);
      workingEnd = timeToMinutes(specialHour.close_time);
      specialReason = specialHour.reason ?? null;
    } else {
      // Não existe horário especial:
      // usa o horário normal da semana.

      const weekday = getWeekday(date);

      const { data: workingHour, error: workingHourError } =
        await admin
          .from("working_hours")
          .select("open_time,close_time,active")
          .eq("establishment_id", service.establishment_id)
          .eq("weekday", weekday)
          .single();

      if (workingHourError) {
        console.error(
          "Erro ao buscar horário de funcionamento:",
          workingHourError
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível consultar o horário de funcionamento."
          },
          { status: 500 }
        );
      }

      if (
        !workingHour ||
        !workingHour.active ||
        !workingHour.open_time ||
        !workingHour.close_time
      ) {
        return NextResponse.json({
          slots: [],
          closed: false,
        });
      }

      workingStart = timeToMinutes(workingHour.open_time);
      workingEnd = timeToMinutes(workingHour.close_time);
    }

    // =========================================================
    // 4. BUSCA AGENDAMENTOS EXISTENTES
    // =========================================================

    const { data: appointments, error: appointmentsError } =
      await admin
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

    // =========================================================
    // 5. VERIFICA HORÁRIO ATUAL
    // =========================================================

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

    let minimumTime = workingStart;

    if (isToday) {
      const [currentHour, currentMinute] = fortalezaTime
        .split(":")
        .map(Number);

      const currentTotal =
        currentHour * 60 + currentMinute;

      minimumTime =
        Math.ceil(currentTotal / 30) * 30;
    }

    // =========================================================
    // 6. GERA OS HORÁRIOS DISPONÍVEIS
    // =========================================================

    const slots: string[] = [];

    for (
      let start = workingStart;
      start + Number(service.duration_minutes) <= workingEnd;
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

    // =========================================================
    // 7. RETORNO
    // =========================================================

    return NextResponse.json({
      slots,
      closed: false,
      special: Boolean(specialHour),
      reason: specialReason,
    });
  } catch (error) {
    console.error("Erro interno:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
