import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { ratelimitCron, getIP } from "../../../../lib/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FROM = "Viko <noreply@viko.com.ar>";
const DASHBOARD = "https://viko.com.ar/dashboard";

function esValido(val: unknown): boolean {
  if (!val) return false;
  if (Array.isArray(val)) return val.filter(Boolean).length > 0;
  if (typeof val === "string") return val.trim().length > 0;
  return false;
}

function diasDesde(fecha: string): number {
  return Math.floor(
    (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function horasDesde(fecha: string): number {
  return Math.floor(
    (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60),
  );
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

function mailPerfilIncompleto(nombre: string) {
  return {
    subject: "Tu perfil en Viko está casi listo 🏪",
    html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FAFAF7; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD5;">

  <div style="background: #1A1814; padding: 28px 32px; text-align: center;">
    <p style="font-family: Georgia, serif; font-size: 26px; color: #FAFAF7; margin: 0; letter-spacing: -0.5px;">Viko<span style="color: #6B7A5A;">.</span></p>
    <p style="font-size: 11px; color: rgba(250,250,247,0.45); margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Directorio de emprendimientos</p>
  </div>

  <div style="padding: 36px 32px 28px;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6B7A5A; margin: 0 0 12px;">Perfil incompleto</p>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1814; margin: 0 0 16px; line-height: 1.3; font-weight: 400;">Hola${nombre ? `, ${nombre}` : ""}! Tu perfil está casi listo</h2>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 24px;">Con un perfil completo tu emprendimiento aparece mejor posicionado en el directorio y genera más confianza en los clientes.</p>

    <div style="padding: 20px; background: #F5F0E8; border-radius: 10px; border-left: 3px solid #6B7A5A; margin-bottom: 28px;">
      <p style="font-size: 12px; font-weight: 700; color: #6B7A5A; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Te falta completar</p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 6px; height: 6px; background: #6B7A5A; border-radius: 50%; flex-shrink: 0;"></span>
          <p style="font-size: 13px; color: #444; margin: 0;">Una descripción de tu emprendimiento</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 6px; height: 6px; background: #6B7A5A; border-radius: 50%; flex-shrink: 0;"></span>
          <p style="font-size: 13px; color: #444; margin: 0;">Al menos una foto de tu producto o marca</p>
        </div>
      </div>
    </div>

    <a href="${DASHBOARD}" style="display: block; text-align: center; padding: 16px 28px; background: #1A1814; color: #FAFAF7; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Completar mi perfil →</a>
  </div>

  <div style="padding: 20px 32px; border-top: 1px solid #E8E4DC; text-align: center;">
    <p style="font-size: 12px; color: #B0AA9F; margin: 0 0 6px;">¿Necesitás ayuda? Escribinos a soporte@viko.com.ar</p>
    <a href="https://viko.com.ar" style="font-size: 12px; color: #6B7A5A; text-decoration: none;">viko.com.ar</a>
  </div>

</div>`,
  };
}

function mailSinFoto(nombre: string) {
  return {
    subject: "Una foto vale mil visitas 📷",
    html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FAFAF7; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD5;">

  <div style="background: #1A1814; padding: 28px 32px; text-align: center;">
    <p style="font-family: Georgia, serif; font-size: 26px; color: #FAFAF7; margin: 0; letter-spacing: -0.5px;">Viko<span style="color: #6B7A5A;">.</span></p>
    <p style="font-size: 11px; color: rgba(250,250,247,0.45); margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Directorio de emprendimientos</p>
  </div>

  <div style="padding: 36px 32px 28px;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6B7A5A; margin: 0 0 12px;">Mejorá tu perfil</p>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1814; margin: 0 0 16px; line-height: 1.3; font-weight: 400;">${nombre ? nombre : "Hola"}, sumá tu primera foto</h2>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 24px;">Los emprendimientos con foto reciben <strong>3 veces más visitas</strong> que los que no tienen. Solo necesitás una buena imagen de tu producto o marca.</p>

    <div style="padding: 20px; background: #F5F0E8; border-radius: 10px; border-left: 3px solid #6B7A5A; margin-bottom: 28px;">
      <p style="font-size: 13px; color: #5a7a4a; font-weight: 700; margin: 0 0 4px;">Tip</p>
      <p style="font-size: 13px; color: #7A756A; margin: 0; line-height: 1.6;">Andá a <strong>Mi perfil → Imágenes</strong> y subí tu primera foto. Tarda menos de un minuto.</p>
    </div>

    <a href="${DASHBOARD}" style="display: block; text-align: center; padding: 16px 28px; background: #1A1814; color: #FAFAF7; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Subir mi foto →</a>
  </div>

  <div style="padding: 20px 32px; border-top: 1px solid #E8E4DC; text-align: center;">
    <p style="font-size: 12px; color: #B0AA9F; margin: 0 0 6px;">¿Necesitás ayuda? Escribinos a soporte@viko.com.ar</p>
    <a href="https://viko.com.ar" style="font-size: 12px; color: #6B7A5A; text-decoration: none;">viko.com.ar</a>
  </div>

</div>`,
  };
}

function mailInactivo15(nombre: string) {
  return {
    subject: "¿Todo bien con tu emprendimiento? 🌱",
    html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FAFAF7; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD5;">

  <div style="background: #1A1814; padding: 28px 32px; text-align: center;">
    <p style="font-family: Georgia, serif; font-size: 26px; color: #FAFAF7; margin: 0; letter-spacing: -0.5px;">Viko<span style="color: #6B7A5A;">.</span></p>
    <p style="font-size: 11px; color: rgba(250,250,247,0.45); margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Directorio de emprendimientos</p>
  </div>

  <div style="padding: 36px 32px 28px;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin: 0 0 12px;">Te extrañamos</p>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1814; margin: 0 0 16px; line-height: 1.3; font-weight: 400;">¿Todo bien${nombre ? `, ${nombre}` : ""}?</h2>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 24px;">Hace un tiempo que no pasás por Viko. Tu perfil sigue activo y visible en el directorio, pero hay algunas cosas que podés hacer para mejorar tu presencia.</p>

    <div style="padding: 20px; background: #F5F0E8; border-radius: 10px; border-left: 3px solid #C9A84C; margin-bottom: 28px;">
      <p style="font-size: 12px; font-weight: 700; color: #C9A84C; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Ideas para cuando tengas un momento</p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 6px; height: 6px; background: #C9A84C; border-radius: 50%; flex-shrink: 0;"></span>
          <p style="font-size: 13px; color: #444; margin: 0;">Actualizá tus fotos con novedades</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 6px; height: 6px; background: #C9A84C; border-radius: 50%; flex-shrink: 0;"></span>
          <p style="font-size: 13px; color: #444; margin: 0;">Agregá productos nuevos a tu catálogo</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 6px; height: 6px; background: #C9A84C; border-radius: 50%; flex-shrink: 0;"></span>
          <p style="font-size: 13px; color: #444; margin: 0;">Revisá tus métricas — quizás tuviste visitas</p>
        </div>
      </div>
    </div>

    <a href="${DASHBOARD}" style="display: block; text-align: center; padding: 16px 28px; background: #1A1814; color: #FAFAF7; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Ir a mi dashboard →</a>
  </div>

  <div style="padding: 20px 32px; border-top: 1px solid #E8E4DC; text-align: center;">
    <p style="font-size: 12px; color: #B0AA9F; margin: 0 0 6px;">Si no querés recibir estos recordatorios escribinos a soporte@viko.com.ar</p>
    <a href="https://viko.com.ar" style="font-size: 12px; color: #6B7A5A; text-decoration: none;">viko.com.ar</a>
  </div>

</div>`,
  };
}

function mailInactivo30(nombre: string) {
  return {
    subject: "Tu emprendimiento sigue en Viko 🛍️",
    html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FAFAF7; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD5;">

  <div style="background: #1A1814; padding: 28px 32px; text-align: center;">
    <p style="font-family: Georgia, serif; font-size: 26px; color: #FAFAF7; margin: 0; letter-spacing: -0.5px;">Viko<span style="color: #6B7A5A;">.</span></p>
    <p style="font-size: 11px; color: rgba(250,250,247,0.45); margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Directorio de emprendimientos</p>
  </div>

  <div style="padding: 36px 32px 28px;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6B7A5A; margin: 0 0 12px;">Tu perfil sigue activo</p>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1814; margin: 0 0 16px; line-height: 1.3; font-weight: 400;">${nombre ? nombre : "Hola"}, tu perfil sigue activo ✨</h2>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 24px;">Hace un mes que no entrás al dashboard. Tu emprendimiento sigue visible y cualquier cliente puede encontrarte en el directorio.</p>
    <p style="font-size: 14px; color: #7A756A; line-height: 1.7; margin: 0 0 28px;">Si tenés novedades, nuevos productos o querés actualizar tus fotos, el dashboard está cuando lo necesites.</p>

    <a href="${DASHBOARD}" style="display: block; text-align: center; padding: 16px 28px; background: #1A1814; color: #FAFAF7; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Ver mi perfil →</a>
  </div>

  <div style="padding: 20px 32px; border-top: 1px solid #E8E4DC; text-align: center;">
    <p style="font-size: 12px; color: #B0AA9F; margin: 0 0 6px;">Si no querés recibir estos recordatorios escribinos a soporte@viko.com.ar</p>
    <a href="https://viko.com.ar" style="font-size: 12px; color: #6B7A5A; text-decoration: none;">viko.com.ar</a>
  </div>

</div>`,
  };
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIP(req);
  const { success } = await ratelimitCron.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Rate limit excedido" }, { status: 429 });
  }

  const { data: emps, error } = await supabase
    .from("emprendimientos")
    .select("id, nombre,rubro, email, images, created_at, updated_at, last_login, ultimo_recordatorio, plan")
    .not("email", "is", null)
    .neq("email", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enviados: string[] = [];
  const errores: string[] = [];

  for (const emp of emps ?? []) {
    const email = emp.email as string;
    const nombre = (emp.nombre as string) ?? "";
    const images = (emp.images as string[]) ?? [];
    const createdAt = emp.created_at as string;
    const lastLogin = emp.last_login as string | null;
    const ultimoRecordatorio = emp.ultimo_recordatorio as string | null;
    const horas = horasDesde(createdAt);
    // last_login mide inactividad real (login), a diferencia de updated_at que se
    // resetea con cualquier UPDATE administrativo. Si nunca volvió a entrar
    // después del registro, last_login es null y usamos created_at como fallback.
    const dias = diasDesde(lastLogin ?? createdAt);
    const tieneFoto = images.filter(Boolean).length > 0;
    const perfilCompleto =
      esValido(emp.nombre) && esValido(emp.rubro) && tieneFoto;

    let template: { subject: string; html: string } | null = null;
    let tipo = "";

    if (!perfilCompleto && horas >= 24 && horas < 48) {
      template = mailPerfilIncompleto(nombre);
      tipo = "perfil_incompleto";
    } else if (!tieneFoto && horas >= 48 && horas < 72) {
      template = mailSinFoto(nombre);
      tipo = "sin_foto";
    } else if (
      dias >= 15 &&
      dias < 30 &&
      ultimoRecordatorio !== "inactivo_15"
    ) {
      // Ventana abierta (15-29 días) en vez de exacta: si el cron falla un día
      // puntual no se pierde el envío. ultimoRecordatorio evita repetirlo
      // todos los días dentro de la ventana.
      template = mailInactivo15(nombre);
      tipo = "inactivo_15";
    } else if (dias >= 30 && ultimoRecordatorio !== "inactivo_30") {
      // Ventana abierta sin tope superior, con el mismo control de repetición.
      template = mailInactivo30(nombre);
      tipo = "inactivo_30";
    }

    if (!template) continue;

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: "diegoalami@gmail.com",
      subject: template.subject,
      html: template.html,
    });

    if (sendError) {
      errores.push(`${email} (${tipo}): ${sendError.message}`);
    } else {
      enviados.push(`${email} (${tipo})`);
      if (tipo === "inactivo_15" || tipo === "inactivo_30") {
        await supabase
          .from("emprendimientos")
          .update({ ultimo_recordatorio: tipo })
          .eq("id", emp.id);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    enviados,
    errores,
    total: enviados.length,
  });
}
