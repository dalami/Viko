"use client";

import { useState } from "react";
import styles from "./Viewplanes.module.css";

interface Props {
  currentPlan: "basic" | "featured" | "premium" | undefined;
  onUpgrade: (periodo: "mensual" | "anual") => void;
}

const FREE_FEATURES = [
  { label: "3 fotos del emprendimiento", included: true },
  { label: "WhatsApp, Instagram y redes sociales", included: true },
  { label: "Perfil público en el directorio", included: true },
  { label: "Hasta 3 productos", included: true },
  { label: "Carrito + MercadoPago", included: false },
  { label: "Productos ilimitados", included: false },
  { label: "Métricas completas", included: false },
  { label: "Tienda online + QR propio", included: false },
];

const PRO_FEATURES = [
  { label: "Todo lo del plan Free", included: true },
  { label: "5 fotos del emprendimiento", included: true },
  { label: "Productos ilimitados", included: true },
  { label: "Carrito + pago con MercadoPago", included: true },
  { label: "Métricas completas", included: true },
  { label: "Tienda online profesional + QR", included: true },
];

export default function ViewPlanes({ currentPlan, onUpgrade }: Props) {
  const [periodo, setPeriodo] = useState<"mensual" | "anual">("anual");
  const isPro = currentPlan === "premium";

  const precio = periodo === "anual" ? "5.940" : "9.900";
  const ahorro = periodo === "anual";

  const [cancelando, setCancelando] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

  async function handleCancelar() {
    if (
      !confirm(
        "¿Confirmás que querés cancelar el plan Pro? Tu cuenta pasará a Free.",
      )
    )
      return;
    setCancelando(true);
    const res = await fetch("/api/mp/cancelar", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setCancelMsg("Plan cancelado. Tu cuenta pasará a Free en breve.");
    } else {
      setCancelMsg("Error al cancelar. Contactanos por email.");
    }
    setCancelando(false);
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>Planes</p>
        <h2 className={styles.title}>
          Elegí cómo querés
          <br />
          <em>potenciar tu negocio</em>
        </h2>
        <p className={styles.sub}>
          Sin comisiones por venta. Cancelás cuando quieras.
        </p>
      </div>
      {/* Toggle mensual / anual */}
      <div className={styles.toggleWrap}>
        <button
          className={`${styles.toggleBtn} ${periodo === "mensual" ? styles.toggleActive : ""}`}
          onClick={() => setPeriodo("mensual")}
        >
          Mensual
        </button>
        <button
          className={`${styles.toggleBtn} ${periodo === "anual" ? styles.toggleActive : ""}`}
          onClick={() => setPeriodo("anual")}
        >
          Anual
          <span className={styles.toggleBadge}>40% off</span>
        </button>
      </div>
      {/* Cards */}
      <div className={styles.cards}>
        {/* FREE */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.planLabel}>FREE</div>
            <div className={styles.planPrice}>
              <span className={styles.priceNum}>$0</span>
              <span className={styles.pricePer}>/mes</span>
            </div>
            <p className={styles.planDesc}>Tu presencia online, sin costo.</p>
          </div>

          <ul className={styles.features}>
            {FREE_FEATURES.map((f) => (
              <li
                key={f.label}
                className={f.included ? styles.featureOn : styles.featureOff}
              >
                <span className={styles.featureIcon}>
                  {f.included ? "✓" : "✕"}
                </span>
                {f.label}
              </li>
            ))}
          </ul>

          <div className={styles.cardBottom}>
            {!isPro ? (
              <div className={styles.currentBadge}>✦ Tu plan actual</div>
            ) : (
              <button className={styles.btnSecondary} disabled>
                Plan Free
              </button>
            )}
          </div>
        </div>
        {/* PRO */}
        <div className={`${styles.card} ${styles.cardPro}`}>
          <div className={styles.recoBadge}>⭐ Recomendado</div>
          <div className={styles.cardTop}>
            <div className={styles.planLabel}>VIKO PRO</div>
            <div className={styles.planPrice}>
              <span className={styles.priceNum}>${precio}</span>
              <span className={styles.pricePer}>/mes</span>
            </div>
            {ahorro && (
              <p className={styles.ahorroTag}>
                $71.280 facturado anual · Ahorrás $47.520
              </p>
            )}
            <p className={styles.planDesc}>
              Todo lo que necesitás para vender más.
            </p>
          </div>
          <ul className={styles.features}>
            {PRO_FEATURES.map((f) => (
              <li key={f.label} className={styles.featureOn}>
                <span className={styles.featureIcon}>✓</span>
                {f.label}
              </li>
            ))}
          </ul>
          <div className={styles.cardBottom}>
            {isPro ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div className={styles.currentBadgePro}>✦ Tu plan actual</div>
                {cancelMsg ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#C4664A",
                      textAlign: "center",
                    }}
                  >
                    {cancelMsg}
                  </p>
                ) : (
                  <button
                    onClick={handleCancelar}
                    disabled={cancelando}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--muted)",
                      textDecoration: "underline",
                      padding: 0,
                      opacity: cancelando ? 0.5 : 1,
                    }}
                  >
                    {cancelando ? "Cancelando..." : "Cancelar plan Pro"}
                  </button>
                )}
              </div>
            ) : (
              <button
                className={styles.btnPro}
                onClick={() => onUpgrade(periodo)}
              >
                {periodo === "anual"
                  ? "⚡ Activar Pro anual — $71.280/año"
                  : "⚡ Activar Pro mensual — $9.900/mes"}
              </button>
            )}
          </div>
        </div>{" "}
        {/* ← cierra card PRO */}
      </div>{" "}
      {/* ← cierra cards */}
      <p className={styles.footNote}>
        Al suscribirte aceptás los términos de uso. El cobro se realiza vía
        MercadoPago. Podés cancelar en cualquier momento desde Mi cuenta.
      </p>
    </div>
  );
}
