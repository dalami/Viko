import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

// Categoría segura por tipo de producto – sin atributos obligatorios
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

    // Preview – antes de confirmar
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

    // Precio editado – máximo 3x el original para evitar manipulación
    const precioFinal =
      precio && precio > 0 && precio <= precioBase * 3 ? precio : precioBase;

    const tituloFinal = titulo?.trim()?.slice(0, 60) || prodReal.nombre;

    // FIX: usar "free" en lugar de "gold_special"
    // gold_special puede ser rechazado si el vendedor no tiene ese tipo habilitado.
    // Una vez publicado, se puede cambiar el listing_type desde ML si se desea.
    const listing: Record<string, unknown> = {
      title: tituloFinal,
      category_id: categoryId,
      price: precioFinal,
      currency_id: "ARS",
      available_quantity: prodReal.stock ?? 10,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "free",
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
      // FIX: loguear el error completo de ML para debugging
      console.error(
        "[ML publish] Error al publicar:",
        JSON.stringify(data, null, 2),
      );

      // Token expirado
      if (
        data?.message?.includes("invalid_token") ||
        data?.message?.includes("expired") ||
        data?.error === "not_found" // token revocado
      ) {
        return NextResponse.json(
          {
            error:
              "Tu conexión con Mercado Libre expiró. Reconectá tu cuenta desde el panel.",
          },
          { status: 401 },
        );
      }

      // FIX: devolver el detalle completo de ML al cliente
      // ML envía los errores específicos en data.cause (array de objetos)
      const causas = Array.isArray(data?.cause)
        ? data.cause.map(
            (c: { code?: string; description?: string }) =>
              c.description ?? c.code ?? JSON.stringify(c),
          )
        : [];

      return NextResponse.json(
        {
          error: "Error al publicar en ML",
          detail: data?.message ?? "Error desconocido",
          causas, // ← acá está el detalle real del 400
          ml_status: res.status,
          payload_enviado: listing, // para debug: ver qué mandamos
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      item_id: data.id,
      permalink: data.permalink,
    });
  } catch (err) {
    // FIX: loguear el error real en vez de tragárselo
    console.error("[ML publish] Error interno:", err);
    return NextResponse.json(
      { error: "Error interno", detail: String(err) },
      { status: 500 },
    );
  }
}
