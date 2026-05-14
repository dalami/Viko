import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { emprendimientoId, items, payer, direccion, notas } = body;

    if (!emprendimientoId || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Traer el token MP del emprendedor
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

    const accessToken = emp.mp_access_token ?? process.env.MP_ACCESS_TOKEN;

    if (emp.plan !== "premium" || !accessToken) {
      return NextResponse.json(
        { error: "El emprendimiento no tiene MercadoPago activo" },
        { status: 403 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL &&
      !process.env.NEXT_PUBLIC_BASE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_BASE_URL
        : "https://viko-ryk4.vercel.app";

    // Crear preferencia con el token del emprendedor
    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
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
        }),
      },
    );

    const data = await response.json();

    console.log("MP Preferences status:", response.status);
    console.log("MP Preferences response:", JSON.stringify(data, null, 2));

    console.log("emp.plan:", emp.plan);
    console.log(
      "emp.mp_access_token:",
      emp.mp_access_token ? "existe" : "null",
    );
    console.log(
      "MP_ACCESS_TOKEN env:",
      process.env.MP_ACCESS_TOKEN ? "existe" : "null",
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al crear preferencia", detail: data },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.init_point });
  } catch (err) {
    console.error("Cart checkout error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
