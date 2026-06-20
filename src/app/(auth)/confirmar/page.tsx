"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";
import regStyles from "../../../register.module.css";

export default function ConfirmarPage() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"verifying" | "ok" | "invalid">(
    "verifying",
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // evita doble ejecución (React strict mode)
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (!tokenHash || type !== "email") {
      setTimeout(() => setStatus("invalid"), 0);
      return;
    }

    supabase.auth
      .verifyOtp({ type: "email", token_hash: tokenHash })
      .then(({ error }) => {
        if (error) {
          setStatus("invalid");
        } else {
          setStatus("ok");
          setTimeout(() => router.replace("/dashboard"), 1800);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={regStyles.successWrap}>
      <div className={regStyles.successCard}>
        <div className={styles.authLogo}>
          Viko<span className={styles.logoDot}>.</span>
        </div>

        {status === "verifying" && (
          <>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#f5f0e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                margin: "24px auto 16px",
              }}
            >
              ⏳
            </div>
            <h2 className={regStyles.successTitle}>Confirmando tu cuenta...</h2>
            <p style={{ fontSize: 13, color: "#888", textAlign: "center" }}>
              Un segundo, estamos activando tu perfil.
            </p>
          </>
        )}

        {status === "ok" && (
          <>
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
              ✅
            </div>
            <h2 className={regStyles.successTitle}>¡Cuenta confirmada!</h2>
            <p
              style={{
                fontSize: 13,
                color: "#555",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Tu perfil ya está activo. Te llevamos a tu panel...
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#f5e8e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                margin: "24px auto 16px",
              }}
            >
              ⚠️
            </div>
            <h2 className={regStyles.successTitle}>
              El link expiró o no es válido
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#555",
                textAlign: "center",
                margin: "12px 0 20px",
                lineHeight: 1.6,
              }}
            >
              Si ya habías confirmado tu cuenta antes, podés iniciar sesión
              directamente.
            </p>
            <Link
              href="/login"
              className={`btn btn-olive ${regStyles.successBtn}`}
            >
              Ir al login →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}