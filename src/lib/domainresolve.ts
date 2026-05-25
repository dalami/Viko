/**
 * domainResolver.ts
 * Módulo nuevo — no modifica código existente.
 *
 * Resuelve qué slug de emprendimiento corresponde a un dominio custom.
 * Usado exclusivamente por el middleware para reescribir requests entrantes.
 */

import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

/** Dominios propios de Viko que no deben procesarse como custom domains */
const VIKO_HOSTS = new Set([
  "viko.com.ar",
  "www.viko.com.ar",
  "localhost",
  "viko-app.vercel.app",
]);

/**
 * Devuelve true si el host del request es un dominio externo (no de Viko).
 */
export function isCustomDomain(host: string): boolean {
  // Quitar puerto si existe (ej: localhost:3000)
  const cleanHost = host.split(":")[0];
  if (VIKO_HOSTS.has(cleanHost)) return false;
  // Ignorar subdominios de Vercel (.vercel.app)
  if (cleanHost.endsWith(".vercel.app")) return false;
  return true;
}

/**
 * Dado un dominio custom, busca en Supabase el slug del emprendimiento
 * que tiene ese dominio verificado.
 *
 * Retorna el slug o null si no existe / no está verificado.
 */
export async function resolveCustomDomain(
  domain: string,
  request: NextRequest,
): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // no-op: solo necesitamos leer
        },
      },
    },
  );

  const { data, error } = await supabase
    .from("emprendimientos")
    .select("nombre, custom_domain, domain_verified")
    .eq("custom_domain", domain)
    .eq("domain_verified", true)
    .eq("visible", true)
    .maybeSingle();

  if (error || !data) return null;

  // Calcular slug igual que slugify() en utils.ts
  const slug = data.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return slug;
}