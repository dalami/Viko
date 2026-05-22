"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

async function handleGoogleLogin() {
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://viko.com.ar/dashboard",
    },
  });
  if (data?.url) {
    window.location.assign(data.url);
  }
}

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          Viko<span className={styles.logoDot}>.</span>
        </div>
        <h1 className={styles.authTitle}>Bienvenido de vuelta</h1>
        <p className={styles.authSub}>Ingresá a tu panel de emprendedor</p>

        <form onSubmit={handleLogin} className={styles.authForm}>
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
          <div className={styles.fieldGroup}>
            <label className="field-label">Contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-olive ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar al panel →"}
          </button>
        </form>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "16px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#E8E4DC" }} />
          <span style={{ fontSize: 12, color: "#8A8680" }}>o continuá con</span>
          <div style={{ flex: 1, height: 1, background: "#E8E4DC" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "1.5px solid #E8E4DC",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "#1A1814",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <p className={styles.authFooter}>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className={styles.authLink}>
            Publicá tu emprendimiento
          </Link>
        </p>
        <Link href="/directorio" className={styles.backLink}>
          ← Volver al directorio
        </Link>
      </div>

      <div className={styles.authDecor}>
        <div className={styles.decorQuote}>
          <p className={styles.decorText}>
            &quot;Presencia online profesional en 15 minutos.&quot;
          </p>
          <p className={styles.decorSub}>
            Miles de emprendedores en LATAM ya están en Viko.
          </p>
        </div>
      </div>
    </div>
  );
}
