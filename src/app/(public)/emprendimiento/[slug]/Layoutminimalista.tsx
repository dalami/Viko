"use client";

import React from "react";
import Link from "next/link";
import { GridMinimalista } from "./Gridlayouts";
import type { LayoutProps } from "./Layouttypes";
import styles from "./public.module.css";

// ─── Layout Minimalista — Art gallery, tipografía XL, sin imágenes ────────────
export default function LayoutMinimalista({
  emp,
  tema,
  productosActivos,
  isPro,
  gridProps,
  onContactWA,
  onContactIG,
  onContactWeb,
}: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: tema.bg, color: tema.text }}>
      {/* ── NAV ── ultra minimal: solo logo centrado */}
      <nav
        style={{
          padding: "0 5vw",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${tema.border}`,
        }}
      >
        <Link
          href="/directorio"
          style={{
            fontSize: 12,
            color: tema.muted,
            textDecoration: "none",
            letterSpacing: 1,
          }}
        >
          ← Directorio
        </Link>

        {/* Logo centrado absoluto */}
        <Link
          href="/directorio"
          className={styles.minimalNavCenter}
          style={{ textDecoration: "none" }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: tema.text,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
            }}
          >
            Viko<span style={{ color: tema.accent }}>.</span>
          </span>
        </Link>
      </nav>

      {/* ── HERO ── puro texto, sin imágenes, muy editorial */}
      <div
        style={{ padding: "80px 5vw 64px", maxWidth: 900, margin: "0 auto" }}
      >
        {/* Categoría / rubro */}
        {emp.rubro && (
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tema.accent,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
              marginBottom: 28,
            }}
          >
            {emp.rubro}
          </p>
        )}

        {/* Nombre enorme */}
        <h1
          style={{
            fontSize: "clamp(52px, 9vw, 112px)",
            fontWeight: 900,
            color: tema.text,
            lineHeight: 0.95,
            letterSpacing: -3,
            marginBottom: 40,
          }}
        >
          {emp.hero_titulo || emp.nombre}
        </h1>

        {/* Línea separadora */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: tema.border,
            marginBottom: 36,
          }}
        />

        {/* Tagline + info en fila */}
        <div className={styles.minimalTaglineGrid}>
          <div>
            {emp.tagline && (
              <p
                style={{
                  fontSize: 18,
                  color: tema.muted,
                  lineHeight: 1.7,
                  marginBottom: 16,
                  maxWidth: 480,
                }}
              >
                {emp.tagline}
              </p>
            )}
            {emp.descripcion && (
              <p
                style={{
                  fontSize: 14,
                  color: tema.muted,
                  lineHeight: 1.85,
                  maxWidth: 440,
                }}
              >
                {emp.descripcion}
              </p>
            )}
          </div>

          {/* Info lateral */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 180,
              paddingTop: 4,
            }}
          >
            {emp.ubicacion && (
              <div>
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: tema.accent,
                    letterSpacing: 3,
                    textTransform: "uppercase" as const,
                    marginBottom: 4,
                  }}
                >
                  Ubicación
                </p>
                <p style={{ fontSize: 13, color: tema.muted }}>
                  {emp.ubicacion}
                </p>
              </div>
            )}
            <div>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: tema.accent,
                  letterSpacing: 3,
                  textTransform: "uppercase" as const,
                  marginBottom: 4,
                }}
              >
                Envíos
              </p>
              <p style={{ fontSize: 13, color: tema.muted }}>
                {emp.envios ? "Todo el país" : "Solo local"}
              </p>
            </div>
            {isPro && (
              <div>
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: tema.accent,
                    letterSpacing: 3,
                    textTransform: "uppercase" as const,
                    marginBottom: 4,
                  }}
                >
                  Pago
                </p>
                <p style={{ fontSize: 13, color: tema.muted }}>
                  Online disponible
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contacto como texto, no botones grandes */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            paddingTop: 36,
            borderTop: `1px solid ${tema.border}`,
            flexWrap: "wrap" as const,
          }}
        >
          {emp.whatsapp && (
            <button
              onClick={onContactWA}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                fontWeight: 600,
                color: tema.text,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "underline",
                textDecorationColor: tema.border,
                textUnderlineOffset: 4,
              }}
            >
              WhatsApp ↗
            </button>
          )}
          {emp.instagram && (
            <button
              onClick={onContactIG}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                fontWeight: 600,
                color: tema.text,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                textDecorationColor: tema.border,
                textUnderlineOffset: 4,
              }}
            >
              Instagram ↗
            </button>
          )}
          {emp.web && (
            <button
              onClick={onContactWeb}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                fontWeight: 600,
                color: tema.text,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                textDecorationColor: tema.border,
                textUnderlineOffset: 4,
              }}
            >
              Sitio web ↗
            </button>
          )}
        </div>
      </div>

      {/* ── PRODUCTOS ── */}
      {productosActivos.length > 0 && (
        <div style={{ padding: "0 5vw 80px", maxWidth: 900, margin: "0 auto" }}>
          {/* Header sección */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 8,
              paddingBottom: 16,
              borderBottom: `1px solid ${tema.border}`,
            }}
          >
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tema.accent,
                letterSpacing: 4,
                textTransform: "uppercase" as const,
              }}
            >
              Productos — {productosActivos.length}
            </h2>
            {isPro && (
              <span
                style={{ fontSize: 11, color: tema.muted, letterSpacing: 1 }}
              >
                Pago online
              </span>
            )}
          </div>

          <GridMinimalista {...gridProps} />
        </div>
      )}

      {/* ── FOOTER ── */}
      <div
        style={{
          borderTop: `1px solid ${tema.border}`,
          padding: "20px 5vw",
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: tema.muted, letterSpacing: 2 }}>
          ✦ VIKO
        </span>
        <Link
          href="/directorio"
          style={{
            fontSize: 11,
            color: tema.muted,
            textDecoration: "none",
            letterSpacing: 1,
          }}
        >
          Ver directorio →
        </Link>
      </div>
    </div>
  );
}
