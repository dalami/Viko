import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

const ATTRS_BLOCKLIST = new Set(["BRAND", "MODEL", "GTIN", "SELLER_SKU"]);

// Términos de búsqueda a probar en orden hasta encontrar una categoría segura
const SEARCH_TERMS = [
  "souvenir personalizado",
  "regalo decoracion",
  "cuadro decorativo",
  "articulo de decoracion",
  "producto artesanal",
];

async function getLeafOf(
  categoryId: string,
  token: string,
  depth = 0,
): Promise<string> {
  if (depth > 6) return categoryId;
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/categories/${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    const children: { id: string }[] = data?.children_categories ?? [];
    if (children.length === 0) return categoryId;
    return getLeafOf(children[0].id, token, depth + 1);
  } catch {
    return categoryId;
  }
}

async function isSafeLeaf(categoryId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/categories/${categoryId}/attributes`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const attrs: { id: string }[] = await res.json();
    if (!Array.isArray(attrs)) return false;
    return !attrs.some((a) => ATTRS_BLOCKLIST.has(a.id));
  } catch {
    return false;
  }
}

async function findSafeCategory(
  token: string,
): Promise<{ categoryId: string; categoryName: string } | null> {
  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch(
        `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=${encodeURIComponent(term)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const results = await res.json();

      for (const cat of results ?? []) {
        if (!cat?.category_id) continue;
        const leafId = await getLeafOf(cat.category_id, token);
        const safe = await isSafeLeaf(leafId, token);
        console.log(
          `[ML publish] "${term}" → ${leafId} → ${safe ? "SEGURA ✓" : "bloqueada ✗"}`,
        );
        if (safe) {
          return { categoryId: leafId, categoryName: cat.domain_name ?? term };
        }
      }
    } catch (e) {
      console.warn(`[ML publish] Error buscando "${term}":`, e);
    }
  }
  return null;
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

    const found = await findSafeCategory(emp.ml_access_token);

    if (!found) {
      return NextResponse.json(
        {
          error:
            "No se encontró categoría válida para publicar. Intentá de nuevo más tarde.",
        },
        { status: 500 },
      );
    }

    const { categoryId, categoryName } = found;
    console.log(`[ML publish] Usando: ${categoryId} (${categoryName})`);

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
