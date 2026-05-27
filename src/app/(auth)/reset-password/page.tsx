"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("No se pudo actualizar. Intentá pedir un nuevo enlace.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>Viko<span className={styles.logoDot}>.</span></div>
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
      </div>
    </div>
  );
}