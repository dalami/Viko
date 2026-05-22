import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/server";
import { ratelimitStrict, getIP } from "../../../lib/ratelimit";

export async function POST(req: NextRequest) {
  // Rate limiting — 10 requests por minuto por IP
  const ip = getIP(req);
  const { success } = await ratelimitStrict.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en un minuto." },
      { status: 429 }
    );
  }

  try {
    const supabase = await createClient();
    const body = await req.json();
    const { emprendimientoId, items, payer, direccion, notas, metodo } = body;

    if (!emprendimientoId || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!payer?.name || !payer?.phone) {
      return NextResponse.json({ error: "Datos del comprador incompletos" }, { status: 400 });
    }

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("id, nombre, mp_access_token, plan")
      .eq("id", emprendimientoId)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "Emprendimiento no encontrado" }, { status: 404 });
    }

    if (!emp.mp_access_token) {
      return NextResponse.json({ error: "El emprendimiento no tiene MercadoPago activo" }, { status: 403 });
    }

    // Leer precios reales desde la DB
    const itemIds = items.map((i: { id: string }) => i.id).filter(Boolean);
    const { data: productos } = await supabase
      .from("productos")
      .select("id, nombre, precio, precio_descuento")
      .in("id", itemIds);

    const preciosReales = Object.fromEntries(
      (productos ?? []).map((p) => [
        p.id,
        { precio: p.precio_descuento ?? p.precio, nombre: p.nombre },
      ])
    );

    for (const item of items) {
      if (!preciosReales[item.id]) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.id}` },
          { status: 400 }
        );
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL &&
      !process.env.NEXT_PUBLIC_BASE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_BASE_URL
        : "https://viko.com.ar";

    const preferenceBody: Record<string, unknown> = {
      items: items.map((i: {
        id: string;
        quantity: number;
        picture_url?: string;
      }) => ({
        id: i.id,
        title: preciosReales[i.id].nombre,
        quantity: Math.max(1, Math.floor(i.quantity)),
        unit_price: preciosReales[i.id].precio,
        currency_id: "ARS",
        picture_url: i.picture_url,
      })),
      payer: {
        name: String(payer.name).slice(0, 50),
        phone: { number: String(payer.phone).replace(/\D/g, "").slice(0, 15) },
      },
      back_urls: {
        success: `${baseUrl}/emprendimiento/pedido-exitoso?emp=${emprendimientoId}`,
        failure: `${baseUrl}/emprendimiento/pedido-error`,
        pending: `${baseUrl}/emprendimiento/pedido-pendiente`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({ emprendimientoId, payer, direccion, notas }),
      statement_descriptor: emp.nombre.slice(0, 22),
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
          Authorization: `Bearer ${emp.mp_access_token}`,
        },
        body: JSON.stringify(preferenceBody),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "Error al crear preferencia" }, { status: 500 });
    }

    return NextResponse.json({ url: data.init_point });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}