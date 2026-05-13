import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig } from "mercadopago";
import { createClient } from "../../../lib/server";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("id, nombre")
      .eq("user_id", user.id)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "Emprendimiento no encontrado" }, { status: 404 });
    }

    // Crear suscripción via API REST de MP
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: "Viko Pro — Plan mensual",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 9900,
          currency_id: "ARS",
        },
        payer_email: "test_user_1887417817478272980@testuser.com",
        back_url: "https://www.mercadopago.com.ar",
        external_reference: `${user.id}|${emp.id}`,
        status: "pending",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP suscripción error:", data);
      return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 });
    }

    return NextResponse.json({ url: data.init_point });
  } catch (err) {
    console.error("MP error:", err);
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 });
  }
}