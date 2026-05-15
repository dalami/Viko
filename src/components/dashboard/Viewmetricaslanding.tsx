"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import styles from "../dashboard/View.module.css";
import { Emprendimiento } from "../../app/(dashboard)/dashboard/DashboardClient";
import { parsePlantilla, COLORES, LAYOUTS } from "../../lib/plantillas";

const TEMAS: Record<
  string,
  {
    bg: string;
    accent: string;
    text: string;
    card: string;
    border: string;
    muted: string;
  }
> = {
  minimalista: {
    bg: "#FAFAF7",
    accent: "#6B7A5A",
    text: "#1A1814",
    card: "#fff",
    border: "#E8E4DC",
    muted: "#8A8680",
  },
  oscura: {
    bg: "#1A1814",
    accent: "#C9A84C",
    text: "#FAFAF7",
    card: "#2D2B26",
    border: "#3A3835",
    muted: "rgba(255,255,255,0.45)",
  },
  vibrante: {
    bg: "#FFF5EC",
    accent: "#E8660A",
    text: "#1A1814",
    card: "#fff",
    border: "#FFD4B0",
    muted: "#8A5A40",
  },
  natural: {
    bg: "#F0F4EC",
    accent: "#3D6B35",
    text: "#1A1814",
    card: "#fff",
    border: "#C8D9C4",
    muted: "#5A7A55",
  },
};

export function ViewLanding({
  emp,
  slug,
  isPro,
}: {
  emp: Emprendimiento;
  slug: string;
  isPro: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const config = parsePlantilla(emp.plantilla);
  const tema = COLORES[config.color] ?? COLORES.oliva;
  const url = `https://viko-ryk4.vercel.app/emprendimiento/${slug || "tu-emprendimiento"}`;
  const displayUrl = `viko-ryk4.vercel.app/emprendimiento/${slug || "tu-emprendimiento"}`;
  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (!isPro || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: "#1A1814", light: "#FAFAF7" },
    });
  }, [isPro, url]);

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (!isPro) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Mi landing</h3>
          <div
            style={{
              background: "linear-gradient(135deg, #1A1814, #2D2B26)",
              borderRadius: 16,
              padding: "32px 24px",
              textAlign: "center",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🌐</div>
            <p
              style={{
                color: "#C9A84C",
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              Landing page — Viko Pro
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Tu URL propia, QR descargable y vista previa de tu ficha.
            </p>
            <button
              onClick={handleUpgrade}
              style={{
                background: "#C9A84C",
                border: "none",
                borderRadius: 100,
                padding: "11px 28px",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "#1A1814",
                cursor: "pointer",
              }}
            >
              Activar Viko Pro — $9.900/mes
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      {/* URL */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tu URL en Viko</h3>
        <div className={styles.urlRow}>
          <span className={styles.urlText}>{displayUrl}</span>
          <button className={styles.copyBtn} onClick={copyUrl}>
            {copied ? "✅ Copiado" : "Copiar"}
          </button>
        </div>
        <div className={styles.domainOption}>
          <div>
            <p className={styles.toggleLabel}>Dominio propio</p>
            <p className={styles.toggleSub}>
              Conectá tu propio dominio (ej: tuemprendimiento.com)
            </p>
          </div>
          <span className={styles.proBadge}>Próximamente</span>
        </div>
      </section>

      {/* QR */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tu QR</h3>
        <p className={styles.sectionSub}>
          Usalo en TikTok, Instagram, packaging o tarjetas. Cada escaneo llega
          directo a tu ficha.
        </p>
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "#FAFAF7",
              border: "1px solid rgba(26,24,20,0.12)",
              borderRadius: 16,
              padding: 20,
              display: "inline-block",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: "block", borderRadius: 8 }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingTop: 8,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#7A756A",
                lineHeight: 1.6,
                maxWidth: 240,
              }}
            >
              Descargá el QR y usalo donde quieras. Cada escaneo queda
              registrado en tus métricas.
            </p>
            <button
              onClick={downloadQR}
              style={{
                background: "#1A1814",
                border: "none",
                borderRadius: 100,
                padding: "11px 24px",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "#FAFAF7",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ⬇️ Descargar QR
            </button>
            <p style={{ fontSize: 11, color: "#9A958A" }}>
              Formato PNG · 200×200px
            </p>
          </div>
        </div>
      </section>

      {/* VISTA PREVIA */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Vista previa de tu landing</h3>
        <p className={styles.sectionSub}>
          Así ven tu página los clientes cuando entran al link.
        </p>
        <div
          className={styles.previewFrame}
          style={{ background: tema.bg, borderColor: tema.border }}
        >
          <div
            className={styles.previewNav}
            style={{
              background: `${tema.bg}f0`,
              borderBottomColor: tema.border,
            }}
          >
            <span className={styles.previewLogo} style={{ color: tema.text }}>
              Viko<span style={{ color: tema.accent }}>.</span>
            </span>
          </div>
          <div className={styles.previewHero}>
            <p className={styles.previewRubro} style={{ color: tema.accent }}>
              {emp.rubro || "Categoría"}
            </p>
            <h2 className={styles.previewName} style={{ color: tema.text }}>
              {emp.nombre || "Tu emprendimiento"}
            </h2>
            <p className={styles.previewTagline} style={{ color: tema.muted }}>
              {emp.tagline || "Tu tagline aparece acá"}
            </p>
            {emp.descripcion && (
              <p
                className={styles.previewTagline}
                style={{ fontSize: 13, color: tema.muted, marginTop: -8 }}
              >
                {emp.descripcion}
              </p>
            )}
            <div className={styles.previewBtns}>
              <span className={styles.previewBtnWa}>💬 WhatsApp</span>
              <span
                className={styles.previewBtnIg}
                style={{ background: tema.accent, color: "#fff" }}
              >
                📷 Instagram
              </span>
            </div>
            {/* Mini preview de productos */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    background: tema.card,
                    border: `1px solid ${tema.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  🛍️
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          Plantilla activa:{" "}
          <strong style={{ color: "var(--black)" }}>
            {LAYOUTS.find((l) => l.id === config.layout)?.label ?? "Clásica"}
          </strong>
          {" · "}
          <button
            onClick={() => {}}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "var(--olive)",
              fontWeight: 600,
            }}
          >
            Cambiar en Productos → Plantilla
          </button>
        </p>
      </section>
    </div>
  );
}

export default ViewLanding;
