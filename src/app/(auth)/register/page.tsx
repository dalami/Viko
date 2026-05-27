"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { createClient } from "@/src/lib/supabase";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";
import regStyles from "../../../register.module.css";
import { slugify } from "../../../lib/utils";

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

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    rubro: "",
  });
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

    const slug = slugify(form.nombre);

    const { data: existing } = await supabase
      .from("emprendimientos")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      setError("Ya existe un emprendimiento con ese nombre. Probá con otro.");
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

    if (data.user) {
      await supabase.from("emprendimientos").insert({
        user_id: data.user.id,
        nombre: form.nombre,
        rubro: form.rubro,
        slug: slug,
        plan: "basic",
        visible: false,
      });
    }

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

          {/* Ícono grande y llamativo */}
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

          {/* Caja destacada con el email */}
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

          {/* Paso a paso */}
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
            <input
              className="input-field"
              type="password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
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

      <div className={styles.authDecor}>
        <div className={styles.decorQuote}>
          <p className={styles.decorText}>
            &quot;Tu marca merece estar en el mejor lugar.&quot;
          </p>
          <p className={styles.decorSub}>
            Directorio curado · Presencia online · Métricas reales
          </p>
        </div>
      </div>
    </div>
  );
}
