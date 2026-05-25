/**
 * /api/domain/verify/route.ts
 * Módulo nuevo — no modifica código existente.
 *
 * Verifica si el dominio del emprendimiento ya apunta a Viko
 * consultando la API de Vercel. Si está OK, marca domain_verified = true.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

/** Consulta el estado del dominio en Vercel */
async function checkDomainInVercel(domain: string): Promise<{
  verified: boolean;
  configured: boolean;
  error?: string;
}> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    // Sin API token, simulamos verificado para desarrollo local
    return {
      verified: false,
      configured: false,
      error: "VERCEL_API_TOKEN no configurado",
    };
  }

  const teamQuery = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : "";
  const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?${teamQuery}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    // Sin cache: siempre consultamos el estado real
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      verified: false,
      configured: false,
      error: "Dominio no encontrado en Vercel",
    };
  }

  const data = await res.json();

  // Vercel indica si la verificación DNS está ok
  const verified: boolean = data.verified === true;
  const configured: boolean = data.configured === true;

  return { verified, configured };
}

export async function POST(_request: NextRequest) {
  try {
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

    // Obtener el dominio del emprendimiento
    const { data: emp, error: empError } = await supabase
      .from("emprendimientos")
      .select("custom_domain, domain_verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (empError || !emp?.custom_domain) {
      return NextResponse.json(
        { ok: false, error: "No tenés un dominio configurado todavía." },
        { status: 400 },
      );
    }

    if (emp.domain_verified) {
      return NextResponse.json({
        ok: true,
        verified: true,
        domain: emp.custom_domain,
        message: "Tu dominio ya estaba verificado.",
      });
    }

    // Consultar Vercel
    const {
      verified,
      configured,
      error: vercelError,
    } = await checkDomainInVercel(emp.custom_domain);

    if (vercelError && !VERCEL_TOKEN) {
      return NextResponse.json({
        ok: true,
        verified: false,
        domain: emp.custom_domain,
        message: "Verificación manual requerida. Configurá VERCEL_API_TOKEN.",
      });
    }

    if (verified && configured) {
      // Marcar como verificado en Supabase
      await supabase
        .from("emprendimientos")
        .update({ domain_verified: true })
        .eq("user_id", user.id);

      return NextResponse.json({
        ok: true,
        verified: true,
        domain: emp.custom_domain,
        message:
          "✅ ¡Dominio verificado! Tu tienda ya es accesible desde tu dominio.",
      });
    }

    return NextResponse.json({
      ok: true,
      verified: false,
      domain: emp.custom_domain,
      message:
        "El DNS todavía no propagó. Puede tardar hasta 48 hs. Intentá de nuevo más tarde.",
    });
  } catch (err) {
    console.error("[domain/verify]", err);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
