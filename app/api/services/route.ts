import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
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

    const { name, price, duration_minutes } = body;

    if (!name || !price || !duration_minutes) {
      return NextResponse.json(
        { error: "Preencha todos os campos." },
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
      .from("services")
      .insert({
        establishment_id: profile.establishment_id,
        name: name.trim(),
        price: Number(price),
        duration_minutes: Number(duration_minutes),
        active: true,
      });

    if (error) {
      console.error("Erro ao cadastrar serviço:", error);

      return NextResponse.json(
        { error: "Não foi possível cadastrar o serviço." },
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

    const { id, name, price, duration_minutes, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Serviço não informado." },
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

    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return NextResponse.json(
          { error: "O nome do serviço não pode ficar vazio." },
          { status: 400 }
        );
      }

      updates.name = String(name).trim();
    }

    if (price !== undefined) {
      updates.price = Number(price);
    }

    if (duration_minutes !== undefined) {
      updates.duration_minutes = Number(duration_minutes);
    }

    if (active !== undefined) {
      updates.active = Boolean(active);
    }

    const { error } = await admin
      .from("services")
      .update(updates)
      .eq("id", id)
      .eq("establishment_id", profile.establishment_id);

    if (error) {
      console.error("Erro ao atualizar serviço:", error);

      return NextResponse.json(
        { error: "Não foi possível atualizar o serviço." },
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
