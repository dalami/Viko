import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { nombre, rubro, email } = await req.json();

  await resend.emails.send({
    from: "Viko <contacto@viko.com.ar>",
    to: "contacto@viko.com.ar",
    subject: `🆕 Nuevo registro en Viko — ${nombre}`,
    html: `
      <h2>Nuevo emprendedor registrado</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Rubro:</strong> ${rubro}</p>
      <p><strong>Email:</strong> ${email}</p>
      
    `,
  });

  return NextResponse.json({ ok: true });
}
