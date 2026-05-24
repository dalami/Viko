import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

const ATTR_DEFAULTS: Record<string, string> = {
  BRAND: "Sin marca",
  MODEL: "Único",
  DEVELOPER: "Sin marca",
  VERSION: "Único",
  SOFTWARE_NAME: "__PRODUCT_NAME__",
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

function cleanProductName(name: string): string {
  return name
    .replace(/\s*x\s*\d+/gi, "")
    .replace(/\s*\d+\s*u\b/gi, "")
    .replace(/pack\s*/gi, "")
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
      if (attr.values && attr.values.length > 0) {
        return { id: attr.id, value_id: attr.values[0].id };
      }
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

// Refresca el access token de ML usando el refresh token
async function refreshMLToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) return null;

    const tokenData = await res.json();
    if (!tokenData.access_token) return null;

    await supabase
      .from("emprendimientos")
      .update({
        ml_access_token: tokenData.access_token,
        ml_refresh_token: tokenData.refresh_token,
      })
      .eq("user_id", userId);

    console.log("[ML publish] Token refrescado correctamente");
    return tokenData.access_token;
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
    const {
      producto,
      confirmar,
      titulo,
      precio,
      categoryId: categoryIdOverride,
    } = body;

    if (!producto?.id || !producto?.nombre) {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }

    const { data: prodReal } = await supabase
      .from("productos")
      .select(
        "id, nombre, precio, precio_descuento, descripcion, imagen, imagenes, stock",
      )
      .eq("id", producto.id)
      .single();

    if (!prodReal) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    const {
      categoryId: detectedId,
      categoryName,
      attributes,
    } = await getCategoryAndAttrs(
      prodReal.nombre,
      emp.ml_access_token,
      prodReal.nombre,
    );
    const categoryId = categoryIdOverride ?? detectedId;

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

    // Construir fotos — usar imagenes[] si existe, sino imagen simple
    const fotos: { source: string }[] = [];
    if (Array.isArray(prodReal.imagenes) && prodReal.imagenes.length > 0) {
      prodReal.imagenes.forEach((url: string) => {
        if (url) fotos.push({ source: url });
      });
    } else if (prodReal.imagen) {
      fotos.push({ source: prodReal.imagen });
    }

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

    if (fotos.length > 0) listing.pictures = fotos;

    console.log("[ML publish] Payload:", JSON.stringify(listing));

    // Intentar publicar con el token actual
    let accessToken = emp.ml_access_token;
    let res = await fetch("https://api.mercadolibre.com/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(listing),
    });

    // Si el token expiró, refrescar y reintentar una vez
    if (res.status === 401 && emp.ml_refresh_token) {
      console.log("[ML publish] Token expirado, intentando refresh...");
      const newToken = await refreshMLToken(
        supabase,
        user.id,
        emp.ml_refresh_token,
      );

      if (newToken) {
        accessToken = newToken;
        res = await fetch("https://api.mercadolibre.com/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(listing),
        });
      } else {
        return NextResponse.json(
          {
            error:
              "Tu conexión con Mercado Libre expiró. Reconectá tu cuenta desde el panel.",
          },
          { status: 401 },
        );
      }
    }

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
