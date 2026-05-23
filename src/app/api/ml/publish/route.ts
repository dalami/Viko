import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

// Defaults para cualquier atributo requerido que ML pueda pedir
const ATTR_DEFAULTS: Record<string, string> = {
  BRAND: "Sin marca",
  MODEL: "Único",
  DEVELOPER: "Sin marca",
  VERSION: "Único",
  SOFTWARE_NAME: "__PRODUCT_NAME__", // reemplazado con nombre real
  GENDER: "Unisex",
  AGE_GROUP: "Adultos",
  COLOR: "Multicolor",
  SIZE: "Único",
  MATERIAL: "Mixto",
  WEIGHT: "Único",
  IS_KIT: "No",
  ALPHANUMERIC_MODEL: "Único",
};

interface MLAttr {
  id: string;
  name: string;
  tags?: { required?: boolean };
  value_type?: string;
  values?: { id: string; name: string }[];
}

// Limpia el nombre del producto antes de pasarlo a domain_discovery
function cleanProductName(name: string): string {
  return name
    .replace(/\s*x\s*\d+/gi, "") // "x 4", "x4"
    .replace(/\s*\d+\s*u\b/gi, "") // "4u", "4 u"
    .replace(/pack\s*/gi, "") // "pack"
    .trim();
}

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

async function buildRequiredAttributes(
  categoryId: string,
  token: string,
  productName: string,
): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/categories/${categoryId}/attributes`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const attrs: MLAttr[] = await res.json();
    if (!Array.isArray(attrs)) return [];

    const required = attrs.filter((a) => a.tags?.required);
    console.log(
      `[ML publish] Atributos requeridos en ${categoryId}: ${required.map((a) => a.id).join(", ") || "ninguno"}`,
    );

    return required.map((attr) => {
      // Si tiene valores predefinidos, usar el primero disponible
      if (attr.values && attr.values.length > 0) {
        return { id: attr.id, value_id: attr.values[0].id };
      }
      // Usar default conocido, o el nombre del producto, o "Único"
      const raw = ATTR_DEFAULTS[attr.id] ?? "Único";
      const value = raw === "__PRODUCT_NAME__" ? productName : raw;
      return { id: attr.id, value_name: value };
    });
  } catch {
    return [];
  }
}

async function getCategoryAndAttrs(
  nombre: string,
  token: string,
  productName: string,
): Promise<{
  categoryId: string;
  categoryName: string;
  attributes: Record<string, unknown>[];
}> {
  const cleanName = cleanProductName(nombre);
  console.log(`[ML publish] Buscando categoría para: "${cleanName}"`);

  try {
    const res = await fetch(
      `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=${encodeURIComponent(cleanName)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    const cat = data?.[0];
    if (!cat?.category_id) throw new Error("no category");

    const leafId = await getLeafOf(cat.category_id, token);
    const attributes = await buildRequiredAttributes(
      leafId,
      token,
      productName,
    );

    // Siempre incluir BRAND y MODEL aunque no estén marcados como required
    // (ML los exige al publicar pero no siempre los marca en la API)
    const hasAttr = (id: string) =>
      attributes.some((a) => (a as { id: string }).id === id);
    if (!hasAttr("BRAND"))
      attributes.push({ id: "BRAND", value_name: "Sin marca" });
    if (!hasAttr("MODEL"))
      attributes.push({ id: "MODEL", value_name: "Único" });

    return {
      categoryId: leafId,
      categoryName: cat.domain_name ?? "General",
      attributes,
    };
  } catch {
    return {
      categoryId: "MLA430643",
      categoryName: "General",
      attributes: [
        { id: "BRAND", value_name: "Sin marca" },
        { id: "MODEL", value_name: "Único" },
      ],
    };
  }
}

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

    const { categoryId, categoryName, attributes } = await getCategoryAndAttrs(
      prodReal.nombre,
      emp.ml_access_token,
      prodReal.nombre,
    );

    console.log(
      `[ML publish] Categoría: ${categoryId} | Atributos: ${JSON.stringify(attributes)}`,
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

    const listing: Record<string, unknown> = {
      title: tituloFinal,
      category_id: categoryId,
      price: precioFinal,
      currency_id: "ARS",
      available_quantity: 1,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "free",
      attributes,
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
