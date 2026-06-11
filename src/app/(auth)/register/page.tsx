"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { createClient } from "../../../lib/supabase";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";
import regStyles from "../../../register.module.css";

const RUBROS = [
  "Gastronomía",
  "Deco",
  "Regalos",
  "Moda",
  "Servicios",
  "Belleza",
  "Eventos",
  "Digital",
  "Masajes",
  "Sublimados",
  "Accesorios",
  "Velas",
  "Suplementos",
  "Aromas",
  "Macrame",
];

const FEATURES = [
  {
    icon: "🪟",
    title: "Vitrina profesional",
    desc: "Tu página con link propio para compartir donde quieras.",
    plan: null,
  },
  {
    icon: "🛍️",
    title: "Catálogo y carrito",
    desc: "Tus productos con fotos, precios y compra directa.",
    plan: "Pro",
  },
  {
    icon: "🚫",
    title: "Sin comisión por venta",
    desc: "Lo que vendés, lo cobrás vos entero. Cero sorpresas.",
    plan: null,
  },
  {
    icon: "📊",
    title: "Métricas",
    desc: "Sabé cuánto vendés y qué productos funcionan mejor.",
    plan: "Pro",
  },
  {
    icon: "🧾",
    title: "Planilla de ventas",
    desc: "Calculá tu ganancia real y tu punto de equilibrio.",
    plan: "Pro",
  },
  {
    icon: "⭐",
    title: "Posicionamiento Pro",
    desc: "Aparecés primero en el directorio. Más visibilidad.",
    plan: "Pro",
  },
  {
    icon: "📱",
    title: "Landing + QR propio",
    desc: "Tu tienda online con QR descargable para compartir.",
    plan: "Pro",
  },
  {
    icon: "💬",
    title: "Contacto directo",
    desc: "WhatsApp e Instagram visibles en tu perfil público.",
    plan: null,
  },
];

function FeatureRow({
  icon,
  title,
  desc,
  plan,
}: {
  icon: string;
  title: string;
  desc: string;
  plan: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#F5F0E8",
              margin: 0,
            }}
          >
            {title}
          </p>
          {plan && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#C9A84C",
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.3)",
                padding: "2px 6px",
                borderRadius: 100,
              }}
            >
              {plan}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "rgba(245,240,232,0.5)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    nombre: "",
    rubro: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre_emprendimiento: form.nombre,
          rubro: form.rubro,
        } as Record<string, string>,
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Este email ya tiene una cuenta. ¿Querés iniciar sesión?"
          : authError.message,
      );
      setLoading(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setError("Este email ya tiene una cuenta. ¿Querés iniciar sesión?");
      setLoading(false);
      return;
    }

    fetch("/api/notificacion-registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        rubro: form.rubro,
        email: form.email,
      }),
    });

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className={regStyles.successWrap}>
        <div className={regStyles.successCard}>
          <div className={styles.authLogo}>
            Viko <span className={styles.logoDot}>.</span>
          </div>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#e8f0e4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              margin: "24px auto 16px",
            }}
          >
            📬
          </div>
          <h2 className={regStyles.successTitle}>¡Revisá tu email!</h2>
          <div
            style={{
              background: "#f5f0e8",
              border: "2px solid #5a7a4a",
              borderRadius: 12,
              padding: "16px 20px",
              margin: "16px 0 8px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              Te enviamos un enlace de confirmación a:
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#2d4a1e",
                wordBreak: "break-all",
              }}
            >
              {form.email}
            </p>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 10,
              padding: "14px 18px",
              margin: "12px 0 20px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#888",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              ¿Qué hacer ahora?
            </p>
            {[
              "Abrí tu bandeja de entrada",
              "Buscá un email de Viko (revisá spam también)",
              "Hacé clic en el botón de confirmación",
              "Listo — iniciá sesión y completá tu perfil",
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#5a7a4a",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <p style={{ fontSize: 13, color: "#444", margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>
          <Link
            href="/login"
            className={`btn btn-olive ${regStyles.successBtn}`}
          >
            Ir al login →
          </Link>
          <p
            style={{
              fontSize: 12,
              color: "#aaa",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            ¿No llegó el email?{" "}
            <span
              style={{
                color: "#5a7a4a",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Revisá la carpeta de spam
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authWrap}>
      {/* FORM */}
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          Viko<span className={styles.logoDot}>.</span>
        </div>
        <h1 className={styles.authTitle}>Publicá tu emprendimiento</h1>
        <p className={styles.authSub}>
          Presencia online profesional en minutos. Sin complicaciones.
        </p>

        <form onSubmit={handleRegister} className={styles.authForm}>
          <div className={regStyles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className="field-label">Nombre del emprendimiento</label>
              <input
                className="input-field"
                name="nombre"
                placeholder="Ej: Mi Marca"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className="field-label">Categoría</label>
              <select
                className="input-field"
                name="rubro"
                value={form.rubro}
                onChange={handleChange}
                required
              >
                <option value="">Elegí una categoría</option>
                {RUBROS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid rgba(26,24,20,0.12)",
              margin: "8px 0",
            }}
          />

          <div className={styles.fieldGroup}>
            <label className="field-label">Email de acceso</label>
            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="hola@tuemprendimiento.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className="field-label">Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#8A8680",
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className="field-label">Confirmar contraseña</label>
            <input
              className="input-field"
              type={showPassword ? "text" : "password"}
              name="confirm"
              placeholder="Repetí tu contraseña"
              value={form.confirm}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-olive ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear mi perfil en Viko →"}
          </button>
        </form>

        <p className={styles.authFooter}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className={styles.authLink}>
            Ingresá acá
          </Link>
        </p>
        <Link href="/directorio" className={styles.backLink}>
          ← Volver al directorio
        </Link>
      </div>

      {/* PANEL DERECHO — FUNCIONALIDADES */}
      <div
        className={styles.authDecor}
        style={{
          background: "#1A1814",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 40px",
          overflowY: "auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--olive)",
            marginBottom: 8,
          }}
        >
          Para emprendedores
        </p>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(22px, 2.5vw, 30px)",
            color: "#F5F0E8",
            letterSpacing: -0.5,
            marginBottom: 4,
          }}
        >
          Todo lo que necesitás
          <br />
          para vender
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(245,240,232,0.45)",
            marginBottom: 24,
          }}
        >
          Gratis para empezar. Sin comisiones. Sin límite de tiempo.
        </p>

        <div>
          {FEATURES.map((f) => (
            <FeatureRow key={f.title} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
}