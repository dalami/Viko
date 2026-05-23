import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

// Categorías seguras por tipo de producto — sin atributos obligatorios
const CATEGORIA_FALLBACK = "MLA1648"; // Artesanías y Manualidades

async function getCategoryId(
  nombre: string,
  token: string,
): Promise<{ categoryId: string; categoryName: string }> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=${encodeURIComponent(nombre)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    const cat = data?.[0];

    if (!cat?.category_id) {
      return { categoryId: CATEGORIA_FALLBACK, categoryName: "Artesanías" };
    }

    // Verificar que la categoría no requiere atributos técnicos complejos
    const attrRes = await fetch(
      `https://api.mercadolibre.com/categories/${cat.category_id}/attributes`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const attrs = await attrRes.json();

    const requiredAttrs = Array.isArray(attrs)
      ? attrs.filter((a: { tags?: { required?: boolean } }) => a.tags?.required)
      : [];

    // Si tiene atributos requeridos complejos, usar categoría fallback
    if (requiredAttrs.length > 2) {
      return { categoryId: CATEGORIA_FALLBACK, categoryName: "Artesanías" };
    }

    return {
      categoryId: cat.category_id,
      categoryName: cat.domain_name ?? "General",
    };
  } catch {
    return { categoryId: CATEGORIA_FALLBACK, categoryName: "Artesanías" };
  }
}

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
      .select("ml_access_token, ml_connected, ml_user_id, ml_refresh_token")
      .eq("user_id", user.id)
      .single();

    if (!emp?.ml_connected || !emp.ml_access_token) {
      return NextResponse.json(
        { error: "MercadoLibre no conectado" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { producto, confirmar, titulo, precio } = body;

    if (!producto?.id || !producto?.nombre) {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }

    // Verificar que el producto existe en la DB
    const { data: prodReal } = await supabase
      .from("productos")
      .select(
        "id, nombre, precio, precio_descuento, descripcion, imagen, stock",
      )
      .eq("id", producto.id)
      .single();

    if (!prodReal) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    const { categoryId, categoryName } = await getCategoryId(
      prodReal.nombre,
      emp.ml_access_token,
    );
    const precioBase = prodReal.precio_descuento ?? prodReal.precio;

    // Preview — antes de confirmar
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

    // Precio editado — máximo 3x el original para evitar manipulación
    const precioFinal =
      precio && precio > 0 && precio <= precioBase * 3 ? precio : precioBase;

    const tituloFinal = titulo?.trim()?.slice(0, 60) || prodReal.nombre;

    const listing: Record<string, unknown> = {
      title: tituloFinal,
      category_id: categoryId,
      price: precioFinal,
      currency_id: "ARS",
      available_quantity: prodReal.stock ?? 10,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "gold_special",
      local_pick_up: true,
      description: { plain_text: prodReal.descripcion ?? prodReal.nombre },
    };

    if (prodReal.imagen) {
      listing.pictures = [{ source: prodReal.imagen }];
    }

    const res = await fetch("https://api.mercadolibre.com/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${emp.ml_access_token}`,
      },
      body: JSON.stringify(listing),
    });

    const data = await res.json();

    if (!res.ok) {
      // Si el token expiró, informar para reconectar
      if (
        data?.message?.includes("invalid_token") ||
        data?.message?.includes("expired")
      ) {
        return NextResponse.json(
          {
            error:
              "Tu conexión con Mercado Libre expiró. Reconectá tu cuenta desde el panel.",
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        {
          error: "Error al publicar en ML",
          detail: data?.message ?? "Error desconocido",
        },
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
