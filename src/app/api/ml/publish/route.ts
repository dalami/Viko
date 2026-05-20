import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("ml_access_token, ml_connected, ml_user_id")
      .eq("user_id", user.id)
      .single();

    if (!emp?.ml_connected || !emp.ml_access_token) {
      return NextResponse.json(
        { error: "MercadoLibre no conectado" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { producto } = body;

    const listing = {
      title: producto.nombre,
      category_id: producto.categoria_ml ?? "MLA3530", // categoría genérica
      price: producto.precio_descuento ?? producto.precio,
      currency_id: "ARS",
      available_quantity: producto.stock ?? 10,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "gold_special",
      description: { plain_text: producto.descripcion ?? producto.nombre },
      pictures: producto.imagen ? [{ source: producto.imagen }] : [],
    };

    const res = await fetch("https://api.mercadolibre.com/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${emp.ml_access_token}`,
      },
      body: JSON.stringify(listing),
    });

    const data = await res.json();
    console.log("ML PUBLISH RESPONSE:", JSON.stringify(data));

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al publicar", detail: data },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      item_id: data.id,
      permalink: data.permalink,
    });
  } catch (e) {
    console.log("ML PUBLISH ERROR:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
