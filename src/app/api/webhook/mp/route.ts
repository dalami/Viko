import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Webhook MP:", JSON.stringify(body));

    // MP manda distintos tipos de notificaciones
    const topic = body.type || body.topic;

    // Suscripción autorizada
    if (topic === "subscription_preapproval") {
      const preapprovalId = body.data?.id || body.id;
      if (!preapprovalId) return NextResponse.json({ ok: true });

      // Obtener detalle de la suscripción
      const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });

      const sub = await res.json();
      console.log("Suscripción:", JSON.stringify(sub));

      if (sub.status !== "authorized") return NextResponse.json({ ok: true });

      // external_reference tiene "userId|empId"
      const [, empId] = (sub.external_reference || "").split("|");
      if (!empId) return NextResponse.json({ ok: true });

      const supabase = await createClient();
      await supabase
        .from("emprendimientos")
        .update({ plan: "premium" })
        .eq("id", Number(empId));

      console.log("Plan actualizado a premium para emp:", empId);
    }

    // Pago de suscripción aprobado
    if (topic === "subscription_authorized_payment") {
      const paymentId = body.data?.id || body.id;
      if (!paymentId) return NextResponse.json({ ok: true });

      const res = await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });

      const payment = await res.json();
      if (payment.status !== "approved") return NextResponse.json({ ok: true });

      // Obtener la suscripción para sacar el external_reference
      const subRes = await fetch(`https://api.mercadopago.com/preapproval/${payment.preapproval_id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });

      const sub = await subRes.json();
      const [, empId] = (sub.external_reference || "").split("|");
      if (!empId) return NextResponse.json({ ok: true });

      // Calcular nueva fecha de vencimiento
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const supabase = await createClient();
      await supabase
        .from("emprendimientos")
        .update({ plan: "premium", plan_expires_at: expiresAt.toISOString() })
        .eq("id", Number(empId));

      console.log("Pago mensual procesado para emp:", empId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}