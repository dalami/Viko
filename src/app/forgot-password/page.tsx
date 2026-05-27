"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase";
import Link from "next/link";
import styles from "../../styles/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://viko.com.ar/auth/reset-password",
    });

    if (resetError) {
      setError("No pudimos enviar el email. Verificá que sea correcto.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className={styles.authWrap}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>Viko<span className={styles.logoDot}>.</span></div>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e8f0e4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "24px auto 16px" }}>
            📬
          </div>
          <h2 className={styles.authTitle}>Revisá tu email</h2>
          <p className={styles.authSub}>
            Te enviamos un enlace para restablecer tu contraseña a <strong>{email}</strong>.
            Revisá también la carpeta de spam.
          </p>
          <Link href="/login" className={`btn btn-olive ${styles.submitBtn}`} style={{ display: "block", textAlign: "center", marginTop: 24 }}>
            Volver al login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>Viko<span className={styles.logoDot}>.</span></div>
        <h1 className={styles.authTitle}>¿Olvidaste tu contraseña?</h1>
        <p className={styles.authSub}>Ingresá tu email y te mandamos el enlace para restablecerla.</p>

        <form onSubmit={handleReset} className={styles.authForm}>
          <div className={styles.fieldGroup}>
            <label className="field-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="hola@tuemprendimiento.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-olive ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar enlace de recupero →"}
          </button>
        </form>

        <p className={styles.authFooter}>
          <Link href="/login" className={styles.authLink}>← Volver al login</Link>
        </p>
      </div>

      <div className={styles.authDecor}>
        <div className={styles.decorQuote}>
          <p className={styles.decorText}>&quot;Tu cuenta, tu negocio, tu control.&quot;</p>
          <p className={styles.decorSub}>Recuperá el acceso en minutos.</p>
        </div>
      </div>
    </div>
  );
}