import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(request: Request) {
  try {
    /*
     * Verifica se o usuário está autenticado
     */
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      status,
      appointment_date,
      start_time,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Agendamento inválido." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    /*
     * Busca o agendamento atual
     */
    const { data: appointment, error: appointmentError } =
      await admin
        .from("appointments")
        .select(`
          id,
          establishment_id,
          service_id,
          appointment_date,
          start_time,
          end_time,
          status,
          services (
            duration_minutes
          )
        `)
        .eq("id", id)
        .single();

    if (appointmentError || !appointment) {
      console.error(
        "Erro ao buscar agendamento:",
        appointmentError
      );

      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    /*
     * =========================
     * CANCELAR / CONFIRMAR
     * =========================
     */
    if (
      status &&
      ["confirmed", "cancelled"].includes(status) &&
      !appointment_date &&
      !start_time
    ) {
      const { error } = await admin
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error(
          "Erro ao atualizar status:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível atualizar o agendamento.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    /*
     * =========================
     * ALTERAR DATA / HORÁRIO
     * =========================
     */

    if (!appointment_date || !start_time) {
      return NextResponse.json(
        {
          error:
            "Informe a nova data e o novo horário.",
        },
        { status: 400 }
      );
    }

    /*
     * Obtém a duração do serviço
     */
    const service = Array.isArray(appointment.services)
      ? appointment.services[0]
      : appointment.services;

    const durationMinutes = Number(
      service?.duration_minutes
    );

    if (!durationMinutes) {
      return NextResponse.json(
        {
          error:
            "Não foi possível identificar a duração do serviço.",
        },
        { status: 400 }
      );
    }

    /*
     * Calcula o novo horário final
     */
    const [hours, minutes] = String(start_time)
      .split(":")
      .map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return NextResponse.json(
        {
          error: "Horário inválido.",
        },
        { status: 400 }
      );
    }

    const totalMinutes =
      hours * 60 +
      minutes +
      durationMinutes;

    const endHours =
      Math.floor(totalMinutes / 60);

    const endMinutes =
      totalMinutes % 60;

    const endTime =
      `${String(endHours).padStart(2, "0")}:` +
      `${String(endMinutes).padStart(2, "0")}:00`;

    /*
     * =========================
     * VERIFICA CONFLITO
     * =========================
     *
     * Ignoramos o próprio agendamento
     * que está sendo alterado.
     */
    const { data: conflicts, error: conflictError } =
      await admin
        .from("appointments")
        .select(
          "id,start_time,end_time"
        )
        .eq(
          "establishment_id",
          appointment.establishment_id
        )
        .eq(
          "appointment_date",
          appointment_date
        )
        .in("status", [
          "pending",
          "confirmed",
        ])
        .neq("id", id)
        .lt("start_time", endTime)
        .gt(
          "end_time",
          `${String(start_time).slice(0, 5)}:00`
        )
        .limit(1);

    if (conflictError) {
      console.error(
        "Erro ao verificar conflito:",
        conflictError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar a disponibilidade.",
        },
        { status: 500 }
      );
    }

    if (conflicts?.length) {
      return NextResponse.json(
        {
          error:
            "Esse horário já está ocupado.",
        },
        { status: 409 }
      );
    }

    /*
     * =========================
     * ATUALIZA AGENDAMENTO
     * =========================
     */
    const { error: updateError } =
      await admin
        .from("appointments")
        .update({
          appointment_date,
          start_time:
            `${String(start_time).slice(0, 5)}:00`,
          end_time: endTime,
          status: "confirmed",
        })
        .eq("id", id);

    if (updateError) {
      console.error(
        "Erro ao alterar agendamento:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível alterar o agendamento.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment_date,
      start_time:
        `${String(start_time).slice(0, 5)}:00`,
      end_time: endTime,
    });
  } catch (error) {
    console.error(
      "Erro interno:",
      error
    );

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
