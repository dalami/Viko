import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("id, nombre")
      .eq("user_id", user.id)
      .single();

    if (!emp) {
      return NextResponse.json(
        { error: "Emprendimiento no encontrado" },
        { status: 404 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const periodo = body.periodo === "anual" ? "anual" : "mensual";

    const isAnual = periodo === "anual";
    const monto = isAnual ? 71280 : 9900;
    const frecuencia = isAnual ? 12 : 1;
    const descripcion = isAnual
      ? "Viko Pro — Plan anual (40% off)"
      : "Viko Pro — Plan mensual";

    // Resuelve la base URL: usa Vercel en prod, localhost en dev
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL &&
      !process.env.NEXT_PUBLIC_BASE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_BASE_URL
        : "https://viko-ryk4.vercel.app";

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: descripcion,
        auto_recurring: {
          frequency: frecuencia,
          frequency_type: "months",
          transaction_amount: monto,
          currency_id: "ARS",
        },
        payer_email: "test_user_1887417817478272980@testuser.com",
        back_url: `${baseUrl}/dashboard?pago=exitoso`,
        external_reference: `${user.id}|${emp.id}|${periodo}`,
        status: "pending",
      }),
    });

    const data = await response.json();

    console.log("MP status:", response.status);
    console.log("MP response:", JSON.stringify(data, null, 2));
    console.log("back_url usada:", `${baseUrl}/dashboard?pago=exitoso`);

    if (!response.ok) {
      console.error("MP suscripción error:", data);
      return NextResponse.json(
        { error: "Error al crear suscripción", detail: data },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.init_point });
  } catch (err) {
    console.error("MP error:", err);
    return NextResponse.json(
      { error: "Error al crear suscripción" },
      { status: 500 },
    );
  }
}