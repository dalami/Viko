"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import styles from "../dashboard/View.module.css";
import type { Emprendimiento } from "../../lib/types";
import { parsePlantilla, COLORES, LAYOUTS } from "../../lib/plantillas";
import Image from "next/image";

export function ViewLanding({
  emp,
  slug,
  isPro,
  onUpgrade,
}: {
  emp: Emprendimiento;
  slug: string;
  isPro: boolean;
  onUpgrade?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const config = parsePlantilla(emp.plantilla);
  const tema = COLORES[config.color] ?? COLORES.oliva;
  const url = `https://viko.com.ar/emprendimiento/${slug || "tu-emprendimiento"}`;
  const displayUrl = `viko.com.ar/emprendimiento/${slug || "tu-emprendimiento"}`;

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
          <h3 className={styles.sectionTitle}>Mi Tienda</h3>
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
              Mi Tienda — Viko Pro
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
              onClick={() => onUpgrade?.()}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "var(--cream)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--muted)",
              fontFamily: "monospace",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayUrl}
          </span>
          <button
            onClick={copyUrl}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 100,
              border: "1px solid var(--border)",
              background: copied ? "var(--olive)" : "var(--white)",
              color: copied ? "#fff" : "var(--muted)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
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
        <h3 className={styles.sectionTitle}>Vista previa de tu tienda</h3>
        <p className={styles.sectionSub}>
          Así ven tu página los clientes cuando entran al link.
        </p>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            maxWidth: 360,
            background: tema.bg,
          }}
        >
          {/* Foto de portada */}
          <div
            style={{
              width: "100%",
              height: 180,
              background: tema.card,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {emp.images?.[0] ? (
              <Image
                src={emp.images[0]}
                alt={emp.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="360px"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                }}
              >
                📷
              </div>
            )}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: tema.accent,
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 100,
                zIndex: 1,
              }}
            >
              {emp.rubro || "Categoría"}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: "16px 18px" }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: tema.text,
                margin: "0 0 4px",
                fontFamily: "Syne, sans-serif",
              }}
            >
              {emp.nombre || "Tu emprendimiento"}
            </h2>
            <p style={{ fontSize: 13, color: tema.muted, margin: "0 0 8px" }}>
              {emp.tagline || "Tu tagline aparece acá"}
            </p>
            {emp.ubicacion && (
              <p
                style={{ fontSize: 12, color: tema.muted, margin: "0 0 12px" }}
              >
                📍 {emp.ubicacion}
              </p>
            )}

            {/* Botones */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {emp.whatsapp && (
                <span
                  style={{
                    background: "#25D366",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 100,
                  }}
                >
                  💬 WhatsApp
                </span>
              )}
              {emp.instagram && (
                <span
                  style={{
                    background: tema.accent,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 100,
                  }}
                >
                  📷 Instagram
                </span>
              )}
            </div>

            {/* Fotos adicionales */}
            {(emp.images?.filter(Boolean).length ?? 0) > 1 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {emp.images
                  ?.filter(Boolean)
                  .slice(1, 4)
                  .map((img, i) => (
                    <div
                      key={i}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        overflow: "hidden",
                        background: tema.card,
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <Image
                        src={img}
                        alt=""
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="56px"
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Badge Viko */}
            <div
              style={{
                borderTop: `1px solid ${tema.border}`,
                paddingTop: 10,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 11, color: tema.muted }}>
                ✦ Emprendimiento en <strong>Viko.</strong>
              </span>
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
