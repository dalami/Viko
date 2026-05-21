import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { nombre, email, mensaje } = await req.json();

    if (!nombre || !email || !mensaje) {
      return NextResponse.json(
        { error: "Completá todos los campos" },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: "Viko Contacto <onboarding@resend.dev>",
      to: "diegoalami@gmail.com",
      replyTo: email,
      subject: `Consulta de ${nombre} — Viko`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="margin: 0 0 24px; font-size: 20px; color: #1a1a1a;">
            Nueva consulta desde Viko
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; width: 80px;">Nombre</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #1a1a1a;">${nombre}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #1a1a1a;">${email}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 6px; color: #888; font-size: 12px;">Mensaje</p>
            <p style="margin: 0; font-size: 14px; color: #1a1a1a; line-height: 1.6;">${mensaje}</p>
          </div>
          <p style="margin-top: 24px; font-size: 11px; color: #bbb;">
            Podés responder directamente a este email — llegará a ${email}
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}