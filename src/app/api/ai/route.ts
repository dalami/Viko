import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/server";
import { ratelimitStrict, getIP } from "../../../lib/ratelimit";

// Modelo y tope de tokens fijados en el servidor. El cliente NO los elige
// para evitar que abusen de la cuenta de Anthropic con modelos caros o
// max_tokens enorme.
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1000;
const MAX_MESSAGES = 4;
const MAX_TOTAL_CHARS = 6000;

type Msg = { role: "user" | "assistant"; content: string };

function validarMessages(input: unknown): Msg[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  if (input.length > MAX_MESSAGES) return null;

  let total = 0;
  const out: Msg[] = [];

  for (const m of input) {
    if (typeof m !== "object" || m === null) return null;
    const role = (m as Record<string, unknown>).role;
    const content = (m as Record<string, unknown>).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.length === 0) return null;
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return null;
    out.push({ role, content });
  }

  return out;
}

export async function POST(req: NextRequest) {
  // 1) Solo usuarios autenticados
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2) Rate limiting por IP
  const ip = getIP(req);
  const { success } = await ratelimitStrict.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en un minuto." },
      { status: 429 },
    );
  }

  // 3) Validar el body (solo messages; modelo y tokens los fija el server)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const messages = validarMessages((body as Record<string, unknown>)?.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "messages inválido o demasiado largo" },
      { status: 400 },
    );
  }

  // 4) Llamar a Anthropic con valores controlados por el server
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al generar el texto" },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}