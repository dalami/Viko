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
          <div className={regStyles.successIcon}>✦</div>
          <h2 className={regStyles.successTitle}>¡Ya sos parte de Viko!</h2>
          <p className={regStyles.successSub}>
            Revisá tu email para confirmar tu cuenta y luego completá tu perfil
            desde el panel.
          </p>
          <Link
            href="/login"
            className={`btn btn-olive ${regStyles.successBtn}`}
          >
            Ir al login →
          </Link>
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
            Directorio curado · Landing page propia · Métricas reales
          </p>
        </div>
      </div>
    </div>
  );
}
