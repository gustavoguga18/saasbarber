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

    const blockedDate = body.blocked_date;
    const reason = body.reason?.trim() || null;

    if (!blockedDate) {
      return NextResponse.json(
        { error: "Informe a data que será bloqueada." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("establishment_id")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile?.establishment_id
    ) {
      return NextResponse.json(
        { error: "Não foi possível identificar o estabelecimento." },
        { status: 400 }
      );
    }

    const { data: blockedDateRow, error } = await admin
      .from("blocked_dates")
      .insert({
        establishment_id: profile.establishment_id,
        blocked_date: blockedDate,
        reason,
      })
      .select("id, blocked_date, reason")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Essa data já está bloqueada." },
          { status: 409 }
        );
      }

      console.error("Erro ao bloquear data:", error);

      return NextResponse.json(
        { error: "Não foi possível bloquear a data." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      blockedDate: blockedDateRow,
    });
  } catch (error) {
    console.error("Erro na API de dias bloqueados:", error);

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
        { error: "Informe o bloqueio que será removido." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("establishment_id")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile?.establishment_id
    ) {
      return NextResponse.json(
        { error: "Não foi possível identificar o estabelecimento." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("blocked_dates")
      .delete()
      .eq("id", id)
      .eq("establishment_id", profile.establishment_id);

    if (error) {
      console.error("Erro ao remover data bloqueada:", error);

      return NextResponse.json(
        { error: "Não foi possível remover o bloqueio." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro na API de dias bloqueados:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
