import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const specialDate = body.special_date;
    const openTime = body.open_time;
    const closeTime = body.close_time;
    const reason = body.reason?.trim() || null;

    if (!specialDate || !openTime || !closeTime) {
      return NextResponse.json(
        {
          error:
            "Informe a data, o horário de abertura e o horário de fechamento.",
        },
        { status: 400 }
      );
    }

    if (openTime >= closeTime) {
      return NextResponse.json(
        {
          error:
            "O horário de abertura deve ser anterior ao horário de fechamento.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("establishment_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.establishment_id) {
      return NextResponse.json(
        { error: "Não foi possível identificar o estabelecimento." },
        { status: 400 }
      );
    }

    const { data: specialHour, error } = await admin
      .from("special_hours")
      .insert({
        establishment_id: profile.establishment_id,
        special_date: specialDate,
        open_time: openTime,
        close_time: closeTime,
        reason,
      })
      .select(
        "id, special_date, open_time, close_time, reason"
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Já existe um horário especial cadastrado para essa data.",
          },
          { status: 409 }
        );
      }

      console.error(
        "Erro ao cadastrar horário especial:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível cadastrar o horário especial.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      specialHour,
    });
  } catch (error) {
    console.error(
      "Erro na API de horários especiais:",
      error
    );

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: "Informe o horário especial que será removido." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("establishment_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.establishment_id) {
      return NextResponse.json(
        { error: "Não foi possível identificar o estabelecimento." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("special_hours")
      .delete()
      .eq("id", id)
      .eq("establishment_id", profile.establishment_id);

    if (error) {
      console.error(
        "Erro ao remover horário especial:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível remover o horário especial.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Erro na API de horários especiais:",
      error
    );

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
