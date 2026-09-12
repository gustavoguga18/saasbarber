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

    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Pagamento não informado." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      console.error("Erro ao atualizar pagamento:", error);

      return NextResponse.json(
        { error: "Não foi possível marcar o pagamento como pago." },
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
