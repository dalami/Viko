import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchMP(path: string) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP error ${res.status} en ${path}`);
  return res.json();
}

function empIdFromRef(externalReference: string): number | null {
  const [, empId] = (externalReference || "").split("|");
  return empId ? Number(empId) : null;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Handler: subscription_preapproval ───────────────────────────────────────
// Se dispara cuando se crea, autoriza, pausa o cancela una suscripción

async function handlePreapproval(
  preapprovalId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const sub = await fetchMP(`/preapproval/${preapprovalId}`);
  const empId = empIdFromRef(sub.external_reference);
  if (!empId) return;

  if (sub.status === "authorized") {
    await supabase
      .from("emprendimientos")
      .update({
        plan: "premium",
        mp_preapproval_id: preapprovalId,
        plan_expires_at: addDays(30),
      })
      .eq("id", empId);
    return;
  }

  // Cancelada o pausada → bajar a free
  if (sub.status === "cancelled" || sub.status === "paused") {
    await supabase
      .from("emprendimientos")
      .update({
        plan: "free",
        plan_expires_at: null,
        mp_preapproval_id: preapprovalId,
      })
      .eq("id", empId);
  }
}

// ─── Handler: subscription_authorized_payment ────────────────────────────────
// Se dispara cada vez que MP ejecuta un cobro recurrente

async function handleAuthorizedPayment(
  paymentId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const payment = await fetchMP(`/authorized_payments/${paymentId}`);
  const sub = await fetchMP(`/preapproval/${payment.preapproval_id}`);
  const empId = empIdFromRef(sub.external_reference);
  if (!empId) return;

  if (payment.status === "approved") {
    await supabase
      .from("emprendimientos")
      .update({
        plan: "premium",
        plan_expires_at: addDays(30),
        mp_preapproval_id: payment.preapproval_id,
      })
      .eq("id", empId);
    return;
  }

  // Rechazado o cancelado → bajar a free
  if (payment.status === "rejected" || payment.status === "cancelled") {
    await supabase
      .from("emprendimientos")
      .update({
        plan: "free",
        plan_expires_at: null,
      })
      .eq("id", empId);
  }

  // Si está "in_process" no tocamos nada, esperamos el próximo webhook
}

// ─── Handler: cron de vencimientos ───────────────────────────────────────────
// GET /api/webhook/mp → llamado diariamente desde Vercel Cron
// Protegido con CRON_SECRET en el header Authorization

async function handleCron(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date().toISOString();

  const { data: vencidos, error } = await supabase
    .from("emprendimientos")
    .select("id, mp_preapproval_id, plan_expires_at")
    .eq("plan", "premium")
    .lt("plan_expires_at", now)
    .not("plan_expires_at", "is", null);

  if (error) throw error;
  if (!vencidos || vencidos.length === 0) {
    return { bajados: 0 };
  }

  const idsABajar: number[] = [];

  await Promise.all(
    vencidos.map(async (emp) => {
      if (!emp.mp_preapproval_id) {
        idsABajar.push(emp.id);
        return;
      }

      try {
        const res = await fetch(
          `https://api.mercadopago.com/preapproval/${emp.mp_preapproval_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
          },
        );
        const sub = await res.json();

        if (sub.status !== "authorized") {
          // MP confirma que no está activa → bajar
          idsABajar.push(emp.id);
        } else {
          // Sigue activa en MP pero el webhook llegó tarde → extender
          await supabase
            .from("emprendimientos")
            .update({ plan_expires_at: addDays(30) })
            .eq("id", emp.id);
          console.log(`[cron] Extendido emp ${emp.id} (webhook tardío)`);
        }
      } catch {
        // Si no podemos verificar con MP, no tocamos el plan
        console.warn(`[cron] No se pudo verificar MP para emp ${emp.id}`);
      }
    }),
  );

  if (idsABajar.length > 0) {
    await supabase
      .from("emprendimientos")
      .update({ plan: "free", plan_expires_at: null })
      .in("id", idsABajar);
  }

  return { bajados: idsABajar.length };
}

// ─── POST: webhook de MercadoPago ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = body.type || body.topic;
    const supabase = await createClient();

    if (topic === "subscription_preapproval") {
      const preapprovalId = body.data?.id || body.id;
      if (preapprovalId) await handlePreapproval(preapprovalId, supabase);
    }

    if (topic === "subscription_authorized_payment") {
      const paymentId = body.data?.id || body.id;
      if (paymentId) await handleAuthorizedPayment(paymentId, supabase);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/mp POST]", err);
    // Devolvemos 200 para que MP no reintente indefinidamente
    return NextResponse.json({ ok: true });
  }
}

// ─── GET: cron diario de vencimientos ────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const result = await handleCron(supabase);
    console.log(`[webhook/mp GET] Bajados a free: ${result.bajados}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[webhook/mp GET]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
