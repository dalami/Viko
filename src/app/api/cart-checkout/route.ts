import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { emprendimientoId, items, payer, direccion, notas, metodo } = body;

    if (!emprendimientoId || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("id, nombre, mp_access_token, plan")
      .eq("id", emprendimientoId)
      .single();

    if (!emp) {
      return NextResponse.json(
        { error: "Emprendimiento no encontrado" },
        { status: 404 },
      );
    }

    const accessToken = emp.mp_access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "El emprendimiento no tiene MercadoPago activo" },
        { status: 403 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL &&
      !process.env.NEXT_PUBLIC_BASE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_BASE_URL
        : "https://viko.com.ar";

    const preferenceBody: Record<string, unknown> = {
      items: items.map(
        (i: {
          id: string;
          title: string;
          quantity: number;
          unit_price: number;
          picture_url?: string;
        }) => ({
          id: i.id,
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
          currency_id: "ARS",
          picture_url: i.picture_url,
        }),
      ),
      payer: {
        name: payer.name,
        phone: { number: payer.phone },
      },
      back_urls: {
        success: `${baseUrl}/emprendimiento/pedido-exitoso?emp=${emprendimientoId}`,
        failure: `${baseUrl}/emprendimiento/pedido-error`,
        pending: `${baseUrl}/emprendimiento/pedido-pendiente`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        emprendimientoId,
        payer,
        direccion,
        notas,
      }),
      statement_descriptor: emp.nombre,
    };

    if (metodo === "efectivo") {
      preferenceBody.payment_methods = {
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "digital_currency" },
          { id: "digital_wallet" },
        ],
        installments: 1,
      };
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preferenceBody),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al crear preferencia", detail: data },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.init_point });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
