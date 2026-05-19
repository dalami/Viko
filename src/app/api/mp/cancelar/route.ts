import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("id, mp_preapproval_id")
      .eq("user_id", user.id)
      .single();

    if (!emp?.mp_preapproval_id) {
      return NextResponse.json(
        { error: "No hay suscripción activa" },
        { status: 400 },
      );
    }

    // Cancelar en MercadoPago
    const res = await fetch(
      `https://api.mercadopago.com/preapproval/${emp.mp_preapproval_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al cancelar en MercadoPago" },
        { status: 500 },
      );
    }

    // Actualizar en Supabase
    await supabase
      .from("emprendimientos")
      .update({ plan: "basic", mp_preapproval_id: null })
      .eq("id", emp.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
