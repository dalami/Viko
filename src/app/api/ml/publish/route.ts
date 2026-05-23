import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("USER:", user?.id);
    if (!user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("ml_access_token, ml_connected, ml_user_id")
      .eq("user_id", user.id)
      .single();
    console.log("EMP:", emp?.ml_connected, !!emp?.ml_access_token);

    if (!emp?.ml_connected || !emp.ml_access_token) {
      return NextResponse.json(
        { error: "MercadoLibre no conectado" },
        { status: 403 },
      );
    }

    const body = await req.json();
    console.log("BODY:", JSON.stringify(body));
    const { producto, confirmar, titulo, precio } = body;

    if (!producto?.id || !producto?.nombre) {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }

    const { data: prodReal, error: prodError } = await supabase
      .from("productos")
      .select(
        "id, nombre, precio, precio_descuento, descripcion, imagen, stock",
      )
      .eq("id", producto.id)
      .single();
    console.log("PROD:", prodReal?.id, "ERROR:", prodError?.message);

    if (!prodReal) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    const categoryRes = await fetch(
      `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=${encodeURIComponent(prodReal.nombre)}`,
      { headers: { Authorization: `Bearer ${emp.ml_access_token}` } },
    );
    const categoryData = await categoryRes.json();
    const categoryId = categoryData?.[0]?.category_id ?? "MLA1648";
    const categoryName = categoryData?.[0]?.domain_name ?? "General";

    const precioBase = prodReal.precio_descuento ?? prodReal.precio;

    if (!confirmar) {
      return NextResponse.json({
        ok: true,
        preview: true,
        categoryId,
        categoryName,
        titulo: prodReal.nombre,
        precio: precioBase,
        descripcion: prodReal.descripcion ?? prodReal.nombre,
        imagen: prodReal.imagen,
      });
    }

    // En confirmación usar precio editado si está dentro de rango razonable
    // (máximo 3x el precio original para evitar manipulación extrema)
    const precioFinal =
      precio && precio > 0 && precio <= precioBase * 3 ? precio : precioBase;

    const tituloFinal = titulo?.trim()?.slice(0, 60) || prodReal.nombre;

    const listing = {
      title: tituloFinal,
      category_id: categoryId,
      price: precioFinal,
      currency_id: "ARS",
      available_quantity: prodReal.stock ?? 10,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "gold_special",
      description: { plain_text: prodReal.descripcion ?? prodReal.nombre },
      pictures: prodReal.imagen ? [{ source: prodReal.imagen }] : [],
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
    console.log("ML ERROR:", JSON.stringify(data));

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al publicar en ML", detail: data },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      item_id: data.id,
      permalink: data.permalink,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
