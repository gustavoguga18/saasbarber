import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(request: Request) {
  try {
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
      open_time,
      close_time,
      active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Horário não informado." },
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

    const updates: Record<string, unknown> = {
      active: Boolean(active),
    };

    if (active) {
      if (!open_time || !close_time) {
        return NextResponse.json(
          {
            error:
              "Informe o horário de abertura e fechamento.",
          },
          { status: 400 }
        );
      }

      updates.open_time = open_time;
      updates.close_time = close_time;
    } else {
      updates.open_time = null;
      updates.close_time = null;
    }

    const { error } = await admin
      .from("working_hours")
      .update(updates)
      .eq("id", id)
      .eq("establishment_id", profile.establishment_id);

    if (error) {
      console.error("Erro ao atualizar horário:", error);

      return NextResponse.json(
        { error: "Não foi possível atualizar o horário." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro interno:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
