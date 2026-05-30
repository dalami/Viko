import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { empNombre, empEmail, tipo } = await req.json();

    if (!empEmail || !empNombre) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const tipoLabel: Record<string, string> = {
      whatsapp: "💬 WhatsApp",
      instagram: "📷 Instagram",
      web: "🌐 Sitio web",
    };

    await resend.emails.send({
      from: "Viko <noreply@viko.com.ar>",
      to: empEmail,
      subject: `Alguien contactó tu emprendimiento en Viko`,
      html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FAFAF7; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD5;">

  <div style="background: #1A1814; padding: 28px 32px; text-align: center;">
    <p style="font-family: Georgia, serif; font-size: 26px; color: #FAFAF7; margin: 0; letter-spacing: -0.5px;">Viko<span style="color: #6B7A5A;">.</span></p>
    <p style="font-size: 11px; color: rgba(250,250,247,0.45); margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Directorio de emprendimientos</p>
  </div>

  <div style="padding: 36px 32px 28px;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6B7A5A; margin: 0 0 12px;">Nueva consulta</p>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1814; margin: 0 0 16px; line-height: 1.3; font-weight: 400;">Alguien quiere contactarte</h2>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 28px;">Un visitante hizo clic en <strong>${tipoLabel[tipo] ?? tipo}</strong> desde tu ficha <strong>${empNombre}</strong> en Viko.</p>

    <div style="padding: 20px; background: #F5F0E8; border-radius: 10px; border-left: 3px solid #6B7A5A; margin-bottom: 28px;">
      <p style="font-size: 13px; color: #5a7a4a; font-weight: 700; margin: 0 0 4px;">Tip</p>
      <p style="font-size: 13px; color: #7A756A; margin: 0; line-height: 1.6;">Respondé rápido — los clientes que no reciben respuesta en menos de 1 hora suelen no volver.</p>
    </div>

    <a href="https://viko.com.ar/dashboard" style="display: block; text-align: center; padding: 16px 28px; background: #1A1814; color: #FAFAF7; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Ver mi panel →</a>
  </div>

  <div style="padding: 20px 32px; border-top: 1px solid #E8E4DC; text-align: center;">
    <p style="font-size: 12px; color: #B0AA9F; margin: 0 0 6px;">¿Querés desactivar estas notificaciones? Escribinos a soporte@viko.com.ar</p>
    <a href="https://viko.com.ar" style="font-size: 12px; color: #6B7A5A; text-decoration: none;">viko.com.ar</a>
  </div>

</div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
