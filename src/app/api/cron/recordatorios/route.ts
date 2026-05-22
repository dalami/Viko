import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { ratelimitCron, getIP } from "../../../../lib/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FROM = "Viko <onboarding@resend.dev>";
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
      <div style="font-family: 'Syne', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1A1814;">
        <p style="font-family: 'DM Serif Display', serif; font-size: 28px; margin: 0 0 16px; letter-spacing: -0.5px;">
          Hola${nombre ? `, ${nombre}` : ""}! 👋
        </p>
        <p style="font-size: 15px; color: #5A5550; line-height: 1.7; margin: 0 0 24px;">
          Creaste tu cuenta en Viko pero tu perfil todavía está incompleto. 
          Con un perfil completo tu emprendimiento aparece mejor posicionado en el directorio 
          y genera más confianza en los clientes.
        </p>
        <div style="background: #F5F2EC; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
          <p style="font-size: 13px; font-weight: 700; color: #1A1814; margin: 0 0 12px;">
            Te falta completar:
          </p>
          <ul style="margin: 0; padding: 0 0 0 16px; color: #5A5550; font-size: 14px; line-height: 2;">
            <li>Nombre y rubro de tu emprendimiento</li>
            <li>Una descripción breve</li>
            <li>Al menos una foto</li>
          </ul>
        </div>
        <a href="${DASHBOARD}" style="display: inline-block; background: #1A1814; color: #fff; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; text-decoration: none;">
          Completar mi perfil →
        </a>
        <p style="font-size: 12px; color: #B8B4AC; margin-top: 40px; border-top: 1px solid #E8E4DC; padding-top: 16px;">
          Viko — Directorio de emprendimientos argentinos<br>
          <a href="mailto:diegoalami@gmail.com" style="color: #B8B4AC;">Contacto</a>
        </p>
      </div>
    `,
  };
}

function mailSinFoto(nombre: string) {
  return {
    subject: "Una foto vale mil visitas 📷",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1A1814;">
        <p style="font-family: 'DM Serif Display', serif; font-size: 28px; margin: 0 0 16px; letter-spacing: -0.5px;">
          ${nombre ? nombre : "Hola"}, sumá tu primera foto 📸
        </p>
        <p style="font-size: 15px; color: #5A5550; line-height: 1.7; margin: 0 0 24px;">
          Los emprendimientos con foto reciben <strong>3 veces más visitas</strong> que los que no tienen. 
          Solo necesitás una buena imagen de tu producto o marca para destacarte.
        </p>
        <p style="font-size: 14px; color: #5A5550; line-height: 1.6; margin: 0 0 28px;">
          Entrá al dashboard, andá a <strong>Mi perfil → Imágenes</strong> y subí tu primera foto. 
          Tarda menos de un minuto.
        </p>
        <a href="${DASHBOARD}" style="display: inline-block; background: #1A1814; color: #fff; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; text-decoration: none;">
          Subir mi foto →
        </a>
        <p style="font-size: 12px; color: #B8B4AC; margin-top: 40px; border-top: 1px solid #E8E4DC; padding-top: 16px;">
          Viko — Directorio de emprendimientos argentinos
        </p>
      </div>
    `,
  };
}

function mailInactivo15(nombre: string) {
  return {
    subject: "¿Todo bien con tu emprendimiento? 🌱",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1A1814;">
        <p style="font-family: 'DM Serif Display', serif; font-size: 28px; margin: 0 0 16px; letter-spacing: -0.5px;">
          Te extrañamos${nombre ? `, ${nombre}` : ""} 👋
        </p>
        <p style="font-size: 15px; color: #5A5550; line-height: 1.7; margin: 0 0 24px;">
          Hace un tiempo que no pasás por Viko. Tu perfil sigue activo y visible 
          en el directorio, pero hay algunas cosas que podés hacer para mejorar tu presencia.
        </p>
        <div style="background: #F5F2EC; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
          <p style="font-size: 13px; font-weight: 700; color: #1A1814; margin: 0 0 12px;">
            Algunas ideas para cuando tengas un momento:
          </p>
          <ul style="margin: 0; padding: 0 0 0 16px; color: #5A5550; font-size: 14px; line-height: 2;">
            <li>Actualizá tus fotos con novedades</li>
            <li>Agregá productos nuevos a tu catálogo</li>
            <li>Revisá tus métricas — quizás tuviste visitas</li>
          </ul>
        </div>
        <a href="${DASHBOARD}" style="display: inline-block; background: #1A1814; color: #fff; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; text-decoration: none;">
          Ir a mi dashboard →
        </a>
        <p style="font-size: 12px; color: #B8B4AC; margin-top: 40px; border-top: 1px solid #E8E4DC; padding-top: 16px;">
          Viko — Directorio de emprendimientos argentinos<br>
          Si no querés recibir estos recordatorios respondé este email.
        </p>
      </div>
    `,
  };
}

function mailInactivo30(nombre: string) {
  return {
    subject: "Tu emprendimiento sigue en Viko 🛍️",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1A1814;">
        <p style="font-family: 'DM Serif Display', serif; font-size: 28px; margin: 0 0 16px; letter-spacing: -0.5px;">
          ${nombre ? nombre : "Hola"}, tu perfil sigue activo ✨
        </p>
        <p style="font-size: 15px; color: #5A5550; line-height: 1.7; margin: 0 0 24px;">
          Hace un mes que no entrás al dashboard. Solo queríamos avisarte que 
          tu emprendimiento sigue visible y cualquier cliente puede encontrarte.
        </p>
        <p style="font-size: 15px; color: #5A5550; line-height: 1.7; margin: 0 0 28px;">
          Si tenés novedades, nuevos productos o querés actualizar tus fotos, 
          el dashboard está cuando lo necesites.
        </p>
        <a href="${DASHBOARD}" style="display: inline-block; background: #4A7C59; color: #fff; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; text-decoration: none;">
          Ver mi perfil →
        </a>
        <p style="font-size: 12px; color: #B8B4AC; margin-top: 40px; border-top: 1px solid #E8E4DC; padding-top: 16px;">
          Viko — Directorio de emprendimientos argentinos<br>
          Si no querés recibir estos recordatorios respondé este email.
        </p>
      </div>
    `,
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
    .select("id, nombre,rubro, email, images, created_at, updated_at, plan")
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
    const updatedAt = emp.updated_at as string;
    const horas = horasDesde(createdAt);
    const dias = diasDesde(updatedAt);
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
    } else if (dias >= 15 && dias < 16) {
      template = mailInactivo15(nombre);
      tipo = "inactivo_15";
    } else if (dias >= 30 && dias < 31) {
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
    }
  }

  return NextResponse.json({
    ok: true,
    enviados,
    errores,
    total: enviados.length,
  });
}
