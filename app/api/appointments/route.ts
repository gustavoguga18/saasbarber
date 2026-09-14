import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/admin";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

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
      adminMode,
    } = body;

    console.log(
      "Método de pagamento recebido:",
      paymentMethod
    );

    console.log(
      "Modo administrativo:",
      adminMode
    );

    // =========================
    // VALIDAÇÃO DOS CAMPOS
    // =========================

    if (
      !serviceId ||
      !date ||
      !time ||
      !name ||
      !phone ||
      !paymentMethod
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha todos os campos.",
        },
        { status: 400 }
      );
    }

    if (
      !["pix", "card", "cash"].includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Forma de pagamento inválida.",
        },
        { status: 400 }
      );
    }

    // =========================
    // VALIDAÇÃO DA SEMANA
    // =========================
    //
    // Para clientes:
    //
    // Segunda a sábado:
    // → agenda da semana atual
    //
    // Domingo:
    // → abre a próxima semana
    //
    // Domingo não é dia de atendimento.
    //
    // AdminMode fica livre para o barbeiro
    // realizar agendamentos manuais.
    //
    // O cálculo usa o fuso de Fortaleza
    // para não depender do fuso do servidor.

    if (!adminMode) {
      // =========================
      // DATA ATUAL EM FORTALEZA
      // =========================

      const fortalezaDate =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "America/Fortaleza",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(new Date());

      const [
        currentYear,
        currentMonth,
        currentDay,
      ] = fortalezaDate
        .split("-")
        .map(Number);

      const today = new Date(
        currentYear,
        currentMonth - 1,
        currentDay
      );

      const dayOfWeek =
        today.getDay();

      // =========================
      // DEFINIR SEGUNDA-FEIRA
      // =========================

      let monday: Date;

      if (dayOfWeek === 0) {
        // Domingo:
        // abre a próxima semana.

        monday = new Date(today);

        monday.setDate(
          today.getDate() + 1
        );
      } else {
        // Segunda a sábado:
        // usa a segunda-feira desta semana.

        monday = new Date(today);

        monday.setDate(
          today.getDate() -
            (dayOfWeek - 1)
        );
      }

      // =========================
      // DEFINIR SÁBADO
      // =========================

      const saturday = new Date(
        monday
      );

      saturday.setDate(
        monday.getDate() + 5
      );

      // =========================
      // FORMATAR DATA MÍNIMA
      // =========================

      const minBookingDate =
        `${monday.getFullYear()}-${String(
          monday.getMonth() + 1
        ).padStart(2, "0")}-${String(
          monday.getDate()
        ).padStart(2, "0")}`;

      // =========================
      // FORMATAR DATA MÁXIMA
      // =========================

      const maxBookingDate =
        `${saturday.getFullYear()}-${String(
          saturday.getMonth() + 1
        ).padStart(2, "0")}-${String(
          saturday.getDate()
        ).padStart(2, "0")}`;

      // =========================
      // VALIDAR DATA SOLICITADA
      // =========================

      const [
        dateYear,
        dateMonth,
        dateDay,
      ] = String(date)
        .split("-")
        .map(Number);

      const requestedDate =
        new Date(
          dateYear,
          dateMonth - 1,
          dateDay
        );

      const requestedDay =
        requestedDate.getDay();

      // Domingo nunca pode ser agendado.
      //
      // A data também precisa estar dentro
      // da semana atualmente liberada.

      if (
        requestedDay === 0 ||
        date < minBookingDate ||
        date > maxBookingDate
      ) {
        return NextResponse.json(
          {
            error:
              "Essa data não está disponível para agendamento.",
          },
          { status: 400 }
        );
      }
    }

    const admin =
      createAdminClient();

    // =========================
    // BUSCAR SERVIÇO
    // =========================

    const {
      data: service,
      error: serviceError,
    } = await admin
      .from("services")
      .select(
        "id,name,price,duration_minutes,establishment_id"
      )
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (
      serviceError ||
      !service
    ) {
      return NextResponse.json(
        {
          error:
            "Serviço inválido.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CALCULAR HORÁRIO FINAL
    // =========================

    const [h, m] = String(time)
      .split(":")
      .map(Number);

    const total =
      h * 60 +
      m +
      Number(
        service.duration_minutes
      );

    const endTime = `${String(
      Math.floor(total / 60) % 24
    ).padStart(2, "0")}:${String(
      total % 60
    ).padStart(2, "0")}:00`;

    // =========================
    // VERIFICAR CONFLITO
    // =========================

    const {
      data: existing,
    } = await admin
      .from("appointments")
      .select(
        "id,start_time,end_time"
      )
      .eq(
        "establishment_id",
        service.establishment_id
      )
      .eq(
        "appointment_date",
        date
      )
      .in("status", [
        "pending",
        "confirmed",
      ])
      .lt(
        "start_time",
        endTime
      )
      .gt(
        "end_time",
        `${time}:00`
      )
      .limit(1);

    if (existing?.length) {
      return NextResponse.json(
        {
          error:
            "Esse horário está dentro de outro agendamento.",
        },
        { status: 409 }
      );
    }

    // =========================
    // CRIAR / ATUALIZAR CLIENTE
    // =========================

    const {
      data: customer,
      error: customerError,
    } = await admin
      .from("customers")
      .upsert(
        {
          establishment_id:
            service.establishment_id,

          name:
            String(name).trim(),

          phone:
            String(phone).trim(),
        },
        {
          onConflict:
            "establishment_id,phone",
        }
      )
      .select("id")
      .single();

    if (
      customerError ||
      !customer
    ) {
      console.error(
        "Erro ao cadastrar cliente:",
        customerError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível cadastrar o cliente.",
        },
        { status: 500 }
      );
    }

    // =========================
    // STATUS DO AGENDAMENTO
    // =========================
    //
    // Cliente normal:
    // → pending
    //
    // Agendamento manual:
    // → confirmed

    const appointmentStatus =
      adminMode
        ? "confirmed"
        : "pending";

    // =========================
    // CRIAR AGENDAMENTO
    // =========================

    const {
      data: appointment,
      error,
    } = await admin
      .from("appointments")
      .insert({
        establishment_id:
          service.establishment_id,

        service_id:
          service.id,

        customer_id:
          customer.id,

        appointment_date:
          date,

        start_time:
          `${time}:00`,

        end_time:
          endTime,

        status:
          appointmentStatus,

        price:
          service.price,
      })
      .select("id")
      .single();

    if (
      error ||
      !appointment
    ) {
      if (
        error?.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "Esse horário já está ocupado.",
          },
          { status: 409 }
        );
      }

      console.error(
        "Erro ao criar agendamento:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível criar o agendamento.",
        },
        { status: 500 }
      );
    }

    // =========================
    // REGISTRAR PAGAMENTO
    // =========================

    const {
      error: paymentError,
    } = await admin
      .from("payments")
      .insert({
        appointment_id:
          appointment.id,

        amount:
          service.price,

        method:
          paymentMethod,

        status:
          "pending",
      });

    if (paymentError) {
      console.error(
        "ERRO COMPLETO AO REGISTRAR PAGAMENTO:",
        {
          code:
            paymentError.code,

          message:
            paymentError.message,

          details:
            paymentError.details,

          hint:
            paymentError.hint,
        }
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível registrar a forma de pagamento.",
        },
        { status: 500 }
      );
    }

    /*
     * =========================
     * E-MAIL PARA O ADMINISTRADOR
     * =========================
     */

    try {
      await resend.emails.send({
        from:
          "onboarding@resend.dev",

        to:
          "gustavobarbosagbn@gmail.com",

        subject:
          "🔔 Novo agendamento - Yago Barbershop",

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
            R$ ${Number(service.price)
              .toFixed(2)
              .replace(".", ",")}
          </p>

          <p>
            <strong>Status:</strong>
            ${
              adminMode
                ? "Confirmado — agendamento manual"
                : "Aguardando confirmação"
            }
          </p>
        `,
      });
    } catch (
      emailError
    ) {
      console.error(
        "Erro ao enviar e-mail para o administrador:",
        emailError
      );
    }

    // =========================
    // RESPOSTA
    // =========================

    return NextResponse.json({
      id: appointment.id,
    });
  } catch (error) {
    console.error(
      "Erro interno:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno.",
      },
      { status: 500 }
    );
  }
}
