"use client";

import { useState } from "react";
import styles from "./ViewTutorial.module.css";

type StepTag = "pro" | null;

interface Step {
  title: string;
  hint?: string;
  tag?: StepTag;
}

interface Module {
  id: string;
  icon: string;
  name: string;
  badge: "ambos" | "pro" | "basico";
  badgeLabel: string;
  isNew?: boolean;
  desc: string;
  steps: Step[];
}

const MODULES: Module[] = [
  {
    id: "registro",
    icon: "👤",
    name: "Registro y cuenta",
    badge: "ambos",
    badgeLabel: "Todos",
    desc: "Cómo crear tu cuenta en Viko",
    steps: [
      {
        title: "Ingresá a viko.com.ar",
        hint: "Desde cualquier dispositivo, sin necesidad de app",
      },
      {
        title: 'Clic en "Crear cuenta"',
        hint: "Botón principal en la pantalla de inicio",
      },
      {
        title: "Completá email y contraseña",
        hint: "La contraseña debe tener mínimo 6 caracteres",
      },
      {
        title: "Verificá tu correo",
        hint: "Revisá spam si no aparece el mail de confirmación",
      },
      {
        title: "Elegí tu plan inicial",
        hint: "Podés empezar gratis con el plan Básico",
      },
    ],
  },
  {
    id: "login",
    icon: "🔐",
    name: "Inicio de sesión",
    badge: "ambos",
    badgeLabel: "Todos",
    desc: "Acceder a tu dashboard",
    steps: [
      {
        title: "Ingresá tu email y contraseña",
        hint: "Los mismos que usaste al registrarte",
      },
      { title: 'Clic en "Iniciar sesión"' },
      {
        title: "¿Olvidaste tu contraseña?",
        hint: "Usá el link de recuperación — te llega un mail",
      },
      {
        title: "Llegás al dashboard",
        hint: "Desde acá controlás todo tu emprendimiento",
      },
    ],
  },
  {
    id: "perfil",
    icon: "🏪",
    name: "Perfil del emprendimiento",
    badge: "ambos",
    badgeLabel: "Todos",
    desc: "Configurar tu marca y datos",
    steps: [
      {
        title: "Nombre y categoría",
        hint: "El nombre de tu marca y el rubro principal",
      },
      {
        title: "Tagline",
        hint: "Una frase corta que define tu propuesta de valor",
      },
      {
        title: "Descripción",
        hint: "Contá de qué se trata tu emprendimiento (2-3 líneas)",
      },
      { title: "Ubicación", hint: "Ciudad y provincia donde operás" },
      {
        title: "Guardá los cambios",
        hint: 'Botón "Guardar cambios" en la barra superior',
      },
    ],
  },
  {
    id: "imagenes",
    icon: "📷",
    name: "Imágenes",
    badge: "pro",
    badgeLabel: "Básico: 1 foto / Pro: 5",
    desc: "Fotos que representan tu marca",
    steps: [
      {
        title: "Imagen de portada",
        hint: "La primera que ven tus clientes — la más importante",
      },
      {
        title: "Lifestyle",
        hint: "El producto en uso o en contexto real",
        tag: "pro",
      },
      {
        title: "Branding",
        hint: "Logo o imagen que refuerce tu identidad",
        tag: "pro",
      },
      {
        title: "Packaging",
        hint: "Cómo llega el producto al cliente",
        tag: "pro",
      },
      {
        title: "Promo",
        hint: "Una imagen de oferta, descuento o novedad",
        tag: "pro",
      },
      {
        title: "Formatos aceptados",
        hint: "JPG, PNG o WEBP — recomendado cuadrada con fondo blanco",
      },
    ],
  },
  {
    id: "productos",
    icon: "🛍️",
    name: "Productos",
    badge: "pro",
    badgeLabel: "Pro",
    desc: "Catálogo de lo que vendés",
    steps: [
      {
        title: 'Clic en "+ Agregar producto"',
        hint: "En la sección Productos del dashboard",
      },
      {
        title: "Nombre y precio",
        hint: "Precio en ARS — editable en cualquier momento",
      },
      {
        title: "Descripción del producto",
        hint: "Breve y orientada al beneficio para el cliente",
      },
      {
        title: "Imagen del producto",
        hint: "Fondo blanco o neutro, formato cuadrado",
      },
      {
        title: "Variantes opcionales",
        hint: 'Ej: tipo "Color", opciones "Rojo, Azul, Negro"',
      },
      {
        title: "Guardar",
        hint: "El producto queda visible en tu catálogo y landing",
      },
    ],
  },
  {
    id: "mercadopago",
    icon: "💳",
    name: "Mercado Pago",
    badge: "pro",
    badgeLabel: "Pro",
    desc: "Conectar tu cuenta de cobros",
    steps: [
      {
        title: 'Ir a "Medios de pago"',
        hint: "En el menú lateral del dashboard",
      },
      {
        title: 'Clic en "Conectar Mercado Pago"',
        hint: "Te redirige al portal de MP para autorizar",
      },
      {
        title: "Autorizá la conexión",
        hint: "Iniciá sesión en MP y aprobá los permisos",
      },
      {
        title: "Volvés a Viko automáticamente",
        hint: "La conexión queda guardada — solo se hace una vez",
      },
      {
        title: "Verificá el estado",
        hint: 'El dashboard muestra "Conectado" con tu cuenta activa',
      },
    ],
  },
  {
    id: "medios",
    icon: "💰",
    name: "Medios de pago",
    badge: "pro",
    badgeLabel: "Pro",
    desc: "Qué podés ofrecerle al cliente",
    steps: [
      {
        title: "Tarjeta de crédito y débito",
        hint: "Habilitado automáticamente al conectar MP",
      },
      {
        title: "Transferencia / CVU",
        hint: "Configurá tu alias o CBU para cobros directos",
      },
      {
        title: "Pago en efectivo",
        hint: "Rapipago o PagoFácil — el cliente recibe un código",
      },
      {
        title: "Cuotas sin interés",
        hint: "Configurable desde tu cuenta de Mercado Pago",
      },
    ],
  },
  {
    id: "mercadolibre",
    icon: "🛒",
    name: "Mercado Libre",
    badge: "pro",
    badgeLabel: "Pro",
    isNew: true,
    desc: "Publicar productos en ML desde Viko",
    steps: [
      {
        title: "Conectar cuenta de ML",
        hint: "Autorizás Viko para publicar en tu nombre — solo una vez",
      },
      {
        title: "Seleccionar qué productos publicar",
        hint: "Elegís desde tu catálogo de Viko cuáles subir a ML",
      },
      {
        title: "Ajustar precio para ML",
        hint: "Podés usar el precio de Viko o definir uno específico para ML",
      },
      {
        title: "Completar datos de publicación",
        hint: "Categoría, condición (nuevo/usado), tipo de publicación",
      },
      {
        title: "Método de envío",
        hint: "Mercado Envíos o retiro en persona — por producto",
      },
      {
        title: "Publicar",
        hint: "El producto sube a ML y el link queda guardado en Viko",
      },
      {
        title: "Gestionar publicaciones activas",
        hint: "Ver estado, pausar o modificar desde el panel de Viko",
      },
    ],
  },
  {
    id: "contacto",
    icon: "📱",
    name: "Contacto y redes",
    badge: "pro",
    badgeLabel: "Pro",
    desc: "WhatsApp, Instagram, sitio web",
    steps: [
      {
        title: "WhatsApp de consultas",
        hint: "Los clientes te contactan con un clic desde tu landing",
      },
      {
        title: "Instagram",
        hint: "Link a tu perfil — se muestra como @tuusuario",
      },
      { title: "Sitio web propio", hint: "Si tenés dominio podés linkearlo" },
      {
        title: "Email de pedidos",
        hint: "Puede ser diferente al email de tu cuenta",
      },
    ],
  },
  {
    id: "landing",
    icon: "🌐",
    name: "Tu landing pública",
    badge: "ambos",
    badgeLabel: "Todos",
    desc: "La página que ven tus clientes",
    steps: [
      {
        title: "URL automática desde el día 1",
        hint: "viko.com.ar/emprendimiento/tu-nombre",
      },
      {
        title: "Vista previa en el dashboard",
        hint: "Simulá cómo la ve un cliente antes de compartir",
      },
      {
        title: "Compartir en WhatsApp e Instagram",
        hint: "Botón directo desde el panel",
      },
      {
        title: "Tema de colores",
        hint: "Personalizá la paleta visual de tu landing",
      },
    ],
  },
  {
    id: "planes",
    icon: "⚡",
    name: "Planes y upgrade",
    badge: "ambos",
    badgeLabel: "Todos",
    desc: "Básico vs Pro — qué incluye cada uno",
    steps: [
      {
        title: "Plan básico — gratis",
        hint: "Perfil, 1 foto, landing pública con URL propia",
      },
      {
        title: "Plan pro — pago mensual",
        hint: "Fotos, productos, MP, ML, WhatsApp, temas y más",
      },
      {
        title: "Hacer upgrade",
        hint: 'Dashboard → "Activar Pro" → pago con MP en 2 clics',
      },
      {
        title: "Cancelar o bajar de plan",
        hint: "En cualquier momento desde configuración de cuenta",
      },
    ],
  },
];

export default function ViewTutorial() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeModule = MODULES.find((m) => m.id === activeId) ?? null;

  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [sending, setSending] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [showContacto, setShowContacto] = useState(false);

  async function handleContacto(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setFormMsg({
          ok: true,
          text: "¡Mensaje enviado! Te respondemos pronto.",
        });
        setForm({ nombre: "", email: "", mensaje: "" });
      } else {
        setFormMsg({ ok: false, text: data.error ?? "Error al enviar" });
      }
    } catch {
      setFormMsg({ ok: false, text: "Error de conexión, intentá de nuevo" });
    }
    setSending(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <p className={styles.headerTitle}>Centro de ayuda</p>
        <p className={styles.headerSub}>
          {activeModule
            ? activeModule.desc
            : `${MODULES.length} módulos — clic en uno para ver los pasos`}
        </p>
      </div>

      <div className={styles.body}>
        {/* Columna izquierda — lista de módulos */}
        <div className={styles.moduleList}>
          {MODULES.map((m) => (
            <button
              key={m.id}
              className={[
                styles.moduleItem,
                activeId === m.id ? styles.moduleItemActive : "",
                m.isNew ? styles.moduleItemNew : "",
              ].join(" ")}
              onClick={() => setActiveId(m.id === activeId ? null : m.id)}
            >
              <span className={styles.moduleIcon}>{m.icon}</span>
              <span className={styles.moduleName}>{m.name}</span>
              {m.isNew && <span className={styles.newBadge}>Nuevo</span>}
              {!m.isNew && m.badge === "pro" && (
                <span className={styles.proBadge}>Pro</span>
              )}
              <span className={styles.moduleArrow}>
                {activeId === m.id ? "▾" : "›"}
              </span>
            </button>
          ))}
        </div>

        {/* Columna derecha — detalle de pasos */}
        <div className={styles.stepPanel}>
          {!activeModule ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📖</span>
              <p className={styles.emptyTitle}>Seleccioná un módulo</p>
              <p className={styles.emptySub}>
                Cada módulo te explica paso a paso cómo usar esa funcionalidad
                de Viko.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.stepHeader}>
                <span className={styles.stepHeaderIcon}>
                  {activeModule.icon}
                </span>
                <div>
                  <p className={styles.stepHeaderTitle}>{activeModule.name}</p>
                  <p className={styles.stepHeaderSub}>{activeModule.desc}</p>
                </div>
              </div>

              <div className={styles.stepList}>
                {activeModule.steps.map((step, i) => (
                  <div key={i} className={styles.stepRow}>
                    <div
                      className={[
                        styles.stepNum,
                        activeModule.isNew ? styles.stepNumNew : "",
                      ].join(" ")}
                    >
                      {i + 1}
                    </div>
                    <div className={styles.stepText}>
                      <p className={styles.stepTitle}>{step.title}</p>
                      {step.hint && (
                        <p className={styles.stepHint}>{step.hint}</p>
                      )}
                    </div>
                    {step.tag === "pro" && (
                      <span className={styles.stepTagPro}>Pro</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.contactSection}>
        <button
          className={styles.contactToggle}
          onClick={() => setShowContacto((p) => !p)}
        >
          <span>✉️</span>
          <span>¿Tenés alguna consulta?</span>
          <span className={styles.contactArrow}>
            {showContacto ? "▾" : "›"}
          </span>
        </button>

        {showContacto && (
          <form onSubmit={handleContacto} className={styles.contactForm}>
            <div className={styles.contactRow}>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Nombre</label>
                <input
                  className="input-field"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>
            <div className={styles.contactField}>
              <label className={styles.contactLabel}>Mensaje</label>
              <textarea
                className="input-field"
                value={form.mensaje}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mensaje: e.target.value }))
                }
                placeholder="Contanos tu consulta o sugerencia..."
                rows={4}
                required
              />
            </div>
            {formMsg && (
              <p className={formMsg.ok ? styles.formSuccess : styles.formError}>
                {formMsg.text}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-olive"
              disabled={sending}
              style={{
                alignSelf: "flex-start",
                padding: "10px 24px",
                fontSize: 13,
              }}
            >
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
