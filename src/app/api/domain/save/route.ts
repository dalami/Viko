/**
 * /api/domain/save/route.ts
 * Módulo nuevo — no modifica código existente.
 *
 * Guarda el custom_domain del emprendimiento en Supabase
 * y lo registra en Vercel vía API para que el certificado SSL
 * se provisione automáticamente.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // opcional, si usás team

/** Registra el dominio en el proyecto de Vercel */
async function registerDomainInVercel(domain: string): Promise<{
  ok: boolean;
  error?: string;
  alreadyExists?: boolean;
}> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    // Sin credenciales de Vercel, continuamos de todas formas
    // (el admin agrega el dominio manualmente en Vercel dashboard)
    console.warn(
      "[domain/save] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no configurados",
    );
    return { ok: true };
  }

  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
  const url = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${teamQuery}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  if (res.status === 409) {
    // El dominio ya existe en Vercel — no es un error
    return { ok: true, alreadyExists: true };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message ?? "Error en Vercel API" };
  }

  return { ok: true };
}

/** Limpia y valida que sea un dominio real */
function sanitizeDomain(raw: string): string | null {
  const domain = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .split("/")[0]; // quitar paths

  // Validación básica: tiene al menos un punto y caracteres válidos
  if (!/^[a-z0-9][a-z0-9\-\.]+\.[a-z]{2,}$/.test(domain)) return null;
  return domain;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawDomain: string = body.domain ?? "";

    const domain = sanitizeDomain(rawDomain);
    if (!domain) {
      return NextResponse.json(
        { ok: false, error: "Dominio inválido. Ejemplo: mitienda.com" },
        { status: 400 },
      );
    }

    // Cliente Supabase server-side
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    // Verificar sesión
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    // Verificar que el dominio no esté en uso por otro emprendimiento
    const { data: existing } = await supabase
      .from("emprendimientos")
      .select("id, user_id")
      .eq("custom_domain", domain)
      .maybeSingle();

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este dominio ya está en uso por otro emprendimiento.",
        },
        { status: 409 },
      );
    }

    // Guardar en Supabase (reset domain_verified porque es un dominio nuevo)
    const { error: updateError } = await supabase
      .from("emprendimientos")
      .update({
        custom_domain: domain,
        domain_verified: false,
      })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 },
      );
    }

    // Registrar en Vercel
    const vercelResult = await registerDomainInVercel(domain);
    if (!vercelResult.ok) {
      // El dominio se guardó en Supabase pero Vercel falló
      // Se puede reintentar desde el panel
      console.error("[domain/save] Vercel API error:", vercelResult.error);
      return NextResponse.json({
        ok: true,
        warning:
          "Dominio guardado, pero hubo un error al registrarlo en el servidor. Contactá soporte.",
        domain,
      });
    }

    return NextResponse.json({ ok: true, domain });
  } catch (err) {
    console.error("[domain/save]", err);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
