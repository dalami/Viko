"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"verifying" | "ready" | "invalid">("verifying");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // evita doble ejecución (React strict mode)
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (!tokenHash || type !== "recovery") {
      Promise.resolve().then(() => setStatus("invalid"));
      return;
    }

    supabase.auth
      .verifyOtp({ type: "recovery", token_hash: tokenHash })
      .then(({ error: verifyError }) => {
        setStatus(verifyError ? "invalid" : "ready");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Probá de nuevo.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          Viko<span className={styles.logoDot}>.</span>
        </div>

        {status === "verifying" && (
          <>
            <h1 className={styles.authTitle}>Verificando enlace…</h1>
            <p className={styles.authSub}>Un momento, estamos validando tu enlace de recuperación.</p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className={styles.authTitle}>Enlace inválido o vencido</h1>
            <p className={styles.authSub}>
              Este enlace de recuperación no es válido o ya expiró.
            </p>
            <p className={styles.authFooter}>
              <Link href="/forgot-password" className={styles.authLink}>
                Pedir un nuevo enlace
              </Link>
            </p>
          </>
        )}

        {status === "ready" && (
          <>
            <h1 className={styles.authTitle}>Nueva contraseña</h1>
            <p className={styles.authSub}>Elegí una contraseña segura para tu cuenta.</p>

            <form onSubmit={handleUpdate} className={styles.authForm}>
              <div className={styles.fieldGroup}>
                <label className="field-label">Nueva contraseña</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? "Actualizando..." : "Guardar nueva contraseña →"}
              </button>
            </form>

            <p className={styles.authFooter}>
              <Link href="/login" className={styles.authLink}>← Volver al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}