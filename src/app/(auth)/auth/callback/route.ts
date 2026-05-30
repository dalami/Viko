import { createClient } from "@/src/lib/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.user?.email && data?.user?.email_confirmed_at) {
      const nombre = data.user.user_metadata?.nombre_emprendimiento ?? "emprendedor";

      await resend.emails.send({
        from: "Viko <hola@viko.com.ar>",
        to: data.user.email,
        subject: `¡Tu perfil en Viko está listo, ${nombre}!`,
        html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FAFAF7; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD5;">

  <div style="background: #1A1814; padding: 28px 32px; text-align: center;">
    <p style="font-family: Georgia, serif; font-size: 26px; color: #FAFAF7; margin: 0; letter-spacing: -0.5px;">Viko<span style="color: #6B7A5A;">.</span></p>
    <p style="font-size: 11px; color: rgba(250,250,247,0.45); margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Directorio de emprendimientos</p>
  </div>

  <div style="padding: 36px 32px 28px;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6B7A5A; margin: 0 0 12px;">Cuenta activada</p>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1814; margin: 0 0 16px; line-height: 1.3; font-weight: 400;">¡Tu perfil está listo, ${nombre}!</h2>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 28px;">Bienvenido a la red de emprendimientos argentinos más grande del país. Completá tu perfil para que los clientes puedan encontrarte.</p>

    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
      <div style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #fff; border-radius: 10px; border: 1px solid #E0DDD5;">
        <div style="width: 32px; height: 32px; background: #F5F0E8; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; color: #1A1814; font-weight: 700;">1</div>
        <div>
          <p style="font-size: 13px; font-weight: 700; color: #1A1814; margin: 0 0 2px;">Completá tu perfil</p>
          <p style="font-size: 12px; color: #7A756A; margin: 0;">Agregá descripción, fotos y tus redes</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #fff; border-radius: 10px; border: 1px solid #E0DDD5;">
        <div style="width: 32px; height: 32px; background: #F5F0E8; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; color: #1A1814; font-weight: 700;">2</div>
        <div>
          <p style="font-size: 13px; font-weight: 700; color: #1A1814; margin: 0 0 2px;">Cargá tus productos</p>
          <p style="font-size: 12px; color: #7A756A; margin: 0;">Con fotos, precios y descripción</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #fff; border-radius: 10px; border: 1px solid #E0DDD5;">
        <div style="width: 32px; height: 32px; background: #F5F0E8; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; color: #1A1814; font-weight: 700;">3</div>
        <div>
          <p style="font-size: 13px; font-weight: 700; color: #1A1814; margin: 0 0 2px;">Compartí tu ficha</p>
          <p style="font-size: 12px; color: #7A756A; margin: 0;">Por WhatsApp, Instagram o donde quieras</p>
        </div>
      </div>
    </div>

    <a href="https://viko.com.ar/dashboard" style="display: block; text-align: center; padding: 16px 28px; background: #1A1814; color: #FAFAF7; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Ir a mi panel →</a>
  </div>

  <div style="padding: 20px 32px; border-top: 1px solid #E8E4DC; text-align: center;">
    <p style="font-size: 12px; color: #B0AA9F; margin: 0 0 6px;">¿Tenés dudas? Escribinos a soporte@viko.com.ar</p>
    <a href="https://viko.com.ar" style="font-size: 12px; color: #6B7A5A; text-decoration: none;">viko.com.ar</a>
  </div>

</div>
        `,
      });
    }
  }

  return NextResponse.redirect("https://viko.com.ar/dashboard");
}