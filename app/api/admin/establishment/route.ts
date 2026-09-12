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
      name,
      slogan,
      address,
      instagram,
      whatsapp,
      timezone,
      active,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "O nome da barbearia é obrigatório." },
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
        { error: "Estabelecimento não encontrado." },
        { status: 400 }
      );
    }

    const { data: establishment, error } = await admin
      .from("establishments")
      .update({
        name: name.trim(),
        slogan: slogan?.trim() || null,
        address: address?.trim() || null,
        instagram: instagram?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        timezone: timezone?.trim() || "America/Fortaleza",
        active: Boolean(active),
      })
      .eq("id", profile.establishment_id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "Erro ao atualizar estabelecimento:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível salvar as configurações.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      establishment,
    });
  } catch (error) {
    console.error("Erro interno:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
