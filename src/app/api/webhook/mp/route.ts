import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = body.type || body.topic;

    if (topic === "subscription_preapproval") {
      const preapprovalId = body.data?.id || body.id;
      if (!preapprovalId) return NextResponse.json({ ok: true });

      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        },
      );

      const sub = await res.json();
      if (sub.status !== "authorized") return NextResponse.json({ ok: true });

      const [, empId] = (sub.external_reference || "").split("|");
      if (!empId) return NextResponse.json({ ok: true });

      const supabase = await createClient();
      await supabase
        .from("emprendimientos")
        .update({ plan: "premium" })
        .eq("id", Number(empId));
    }

    if (topic === "subscription_authorized_payment") {
      const paymentId = body.data?.id || body.id;
      if (!paymentId) return NextResponse.json({ ok: true });

      const res = await fetch(
        `https://api.mercadopago.com/authorized_payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        },
      );

      const payment = await res.json();
      if (payment.status !== "approved") return NextResponse.json({ ok: true });

      const subRes = await fetch(
        `https://api.mercadopago.com/preapproval/${payment.preapproval_id}`,
        {
          headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        },
      );

      const sub = await subRes.json();
      const [, empId] = (sub.external_reference || "").split("|");
      if (!empId) return NextResponse.json({ ok: true });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const supabase = await createClient();
      await supabase
        .from("emprendimientos")
        .update({ plan: "premium", plan_expires_at: expiresAt.toISOString() })
        .eq("id", Number(empId));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
