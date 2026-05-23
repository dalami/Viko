import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data: emp } = await supabase
      .from("emprendimientos")
      .select("ml_access_token, ml_connected")
      .eq("user_id", user.id)
      .single();

    if (!emp?.ml_connected || !emp.ml_access_token) {
      return NextResponse.json({ error: "ML no conectado" }, { status: 403 });
    }

    const res = await fetch(
      `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${emp.ml_access_token}` } },
    );
    const data = await res.json();

    const categories = (data ?? [])
      .slice(0, 6)
      .map(
        (c: {
          category_id: string;
          domain_name?: string;
          category_name?: string;
        }) => ({
          id: c.category_id,
          name: c.domain_name ?? c.category_name ?? c.category_id,
        }),
      );

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
