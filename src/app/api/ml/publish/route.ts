import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

const CATEGORIA_ROOT = "MLA1648"; // Artesanías y Manualidades
const ATTRS_BLOCKLIST = new Set(["BRAND", "MODEL", "GTIN", "SELLER_SKU"]);

// Busca el primer leaf dentro de un árbol de categorías donde
// ninguno de los atributos bloqueados esté presente
async function findSafeLeaf(
  categoryId: string,
  token: string,
  depth = 0,
): Promise<string | null> {
  if (depth > 6) return null;
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/categories/${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const catData = await res.json();
    const children: { id: string }[] = catData?.children_categories ?? [];

    if (children.length === 0) {
      // Es un leaf — verificar que no tenga atributos bloqueados
      const attrRes = await fetch(
        `https://api.mercadolibre.com/categories/${categoryId}/attributes`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const attrs: { id: string }[] = await attrRes.json();
      const hasBlocked =
        Array.isArray(attrs) && attrs.some((a) => ATTRS_BLOCKLIST.has(a.id));
      return hasBlocked ? null : categoryId;
    }

    // Probar cada hijo hasta encontrar un leaf seguro
    for (const child of children) {
      const safe = await findSafeLeaf(child.id, token, depth + 1);
      if (safe) return safe;
    }
    return null;
  } catch {
    return null;
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

    // Buscar un leaf seguro dentro de MLA1648
    const categoryId = await findSafeLeaf(CATEGORIA_ROOT, emp.ml_access_token);

    if (!categoryId) {
      console.error(
        "[ML publish] No se encontró categoría leaf segura en MLA1648",
      );
      return NextResponse.json(
        { error: "No se pudo determinar una categoría válida para publicar." },
        { status: 500 },
      );
    }

    console.log(`[ML publish] Categoría leaf segura encontrada: ${categoryId}`);

    const precioBase = prodReal.precio_descuento ?? prodReal.precio;

    if (!confirmar) {
      return NextResponse.json({
        ok: true,
        preview: true,
        categoryId,
        categoryName: "Artesanías",
        titulo: prodReal.nombre,
        precio: precioBase,
        descripcion: prodReal.descripcion ?? prodReal.nombre,
        imagen: prodReal.imagen,
      });
    }

    const precioFinal =
      precio && precio > 0 && precio <= precioBase * 3 ? precio : precioBase;

    const tituloFinal = titulo?.trim()?.slice(0, 60) || prodReal.nombre;

    const listing: Record<string, unknown> = {
      title: tituloFinal,
      category_id: categoryId,
      price: precioFinal,
      currency_id: "ARS",
      available_quantity: 1,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "free",
      description: { plain_text: prodReal.descripcion ?? prodReal.nombre },
    };

    if (prodReal.imagen) {
      listing.pictures = [{ source: prodReal.imagen }];
    }

    console.log("[ML publish] Payload:", JSON.stringify(listing));

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
      console.error("[ML publish] Error:", JSON.stringify(data, null, 2));

      if (
        data?.message?.includes("invalid_token") ||
        data?.message?.includes("expired") ||
        data?.error === "not_found"
      ) {
        return NextResponse.json(
          {
            error:
              "Tu conexión con Mercado Libre expiró. Reconectá tu cuenta desde el panel.",
          },
          { status: 401 },
        );
      }

      const causas = Array.isArray(data?.cause)
        ? data.cause
            .filter((c: { type?: string }) => c.type === "error")
            .map(
              (c: { message?: string; code?: string }) => c.message ?? c.code,
            )
        : [];

      return NextResponse.json(
        {
          error: "Error al publicar en ML",
          detail: data?.message ?? "Error desconocido",
          causas,
          ml_status: res.status,
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
    console.error("[ML publish] Error interno:", err);
    return NextResponse.json(
      { error: "Error interno", detail: String(err) },
      { status: 500 },
    );
  }
}
