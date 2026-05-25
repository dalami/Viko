import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isCustomDomain, resolveCustomDomain } from "./lib/domainresolve";

export async function middleware(request: NextRequest) {
  // ── Custom domain routing ──────────────────────────────────────────────────
  // Si el request viene de un dominio externo, lo resolvemos al slug correcto.
  const host = request.headers.get("host") ?? "";
  if (isCustomDomain(host)) {
    const slug = await resolveCustomDomain(host, request);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/emprendimiento/${slug}`;
      return NextResponse.rewrite(url);
    }
    // Dominio no registrado → 404 limpio
    return new NextResponse("Dominio no registrado en Viko", { status: 404 });
  }
  // ─────────────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: object }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Token inválido o expirado — tratar como no autenticado sin loguear error
  if (error?.code === "refresh_token_not_found") {
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Proteger el dashboard
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si ya está logueado, no mostrar login/register
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    // Captura requests de dominios custom en cualquier path
    // (Next.js pasa el header host al middleware en todos los casos)
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
