import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

const CATEGORIA_FALLBACK_ROOT = "MLA1648";

// Atributos que ML valida contra su catálogo → no admiten valor libre
// Si una categoría los requiere, usamos fallback directamente
const ATTRS_CATALOG_ONLY = new Set(["BRAND", "MODEL", "GTIN", "SELLER_SKU"]);

// Atributos que sí podemos resolver con valor libre
const ATTR_DEFAULTS: Record<string, string> = {
  GENDER: "Unisex",
  AGE_GROUP: "Adultos",
  COLOR: "Multicolor",
  SIZE: "Único",
  MATERIAL: "Mixto",
};

async function getLeafCategory(
  categoryId: string,
  token: string,
  depth = 0,
): Promise<string> {
  if (depth > 5) return categoryId;
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/categories/${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    const children: { id: string }[] = data?.children_categories ?? [];
    if (children.length === 0) return categoryId;
    return getLeafCategory(children[0].id, token, depth + 1);
  } catch {
    return categoryId;
  }
}

interface MLAttribute {
  id: string;
  tags?: { required?: boolean };
  values?: { id: string; name: string }[];
}

async function getCategoryId(
  nombre: string,
  token: string,
): Promise<{
  categoryId: string;
  categoryName: string;
  requiredAttrs: MLAttribute[];
}> {
  const getFallback = async () => {
    const leafFallback = await getLeafCategory(CATEGORIA_FALLBACK_ROOT, token);
    return {
      categoryId: leafFallback,
      categoryName: "Artesanías",
      requiredAttrs: [],
    };
  };

  try {
    const res = await fetch(
      `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=${encodeURIComponent(nombre)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    const cat = data?.[0];

    if (!cat?.category_id) return getFallback();

    const leafId = await getLeafCategory(cat.category_id, token);

    const attrRes = await fetch(
      `https://api.mercadolibre.com/categories/${leafId}/attributes`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const attrs: MLAttribute[] = await attrRes.json();

    const requiredAttrs = Array.isArray(attrs)
      ? attrs.filter((a) => a.tags?.required)
      : [];

    // Si requiere BRAND, MODEL u otro atributo de catálogo → fallback
    const needsCatalogAttr = requiredAttrs.some((a) =>
      ATTRS_CATALOG_ONLY.has(a.id),
    );
    if (needsCatalogAttr) {
      console.log(
        `[ML publish] Categoría ${leafId} requiere atributos de catálogo (${requiredAttrs
          .filter((a) => ATTRS_CATALOG_ONLY.has(a.id))
          .map((a) => a.id)
          .join(", ")}) → usando fallback`,
      );
      return getFallback();
    }

    // Si algún otro atributo requerido tampoco tiene default → fallback
    const unresolvable = requiredAttrs.filter(
      (a) => !ATTRS_CATALOG_ONLY.has(a.id) && !(a.id in ATTR_DEFAULTS),
    );
    if (unresolvable.length > 0) {
      console.log(
        `[ML publish] Categoría ${leafId} tiene atributos sin resolver: ${unresolvable.map((a) => a.id).join(", ")} → usando fallback`,
      );
      return getFallback();
    }

    return {
      categoryId: leafId,
      categoryName: cat.domain_name ?? "General",
      requiredAttrs,
    };
  } catch {
    return getFallback();
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

    const { categoryId, categoryName, requiredAttrs } = await getCategoryId(
      prodReal.nombre,
      emp.ml_access_token,
    );
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

    // Atributos resolubles con valor libre
    const attributes = requiredAttrs
      .filter((a) => a.id in ATTR_DEFAULTS)
      .map((attr) => {
        const defaultVal = ATTR_DEFAULTS[attr.id];
        if (attr.values && attr.values.length > 0) {
          const match = attr.values.find(
            (v) => v.name.toLowerCase() === defaultVal.toLowerCase(),
          );
          return match
            ? { id: attr.id, value_id: match.id }
            : { id: attr.id, value_name: defaultVal };
        }
        return { id: attr.id, value_name: defaultVal };
      });

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

    if (attributes.length > 0) {
      listing.attributes = attributes;
    }

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
