"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GridClasica } from "./Gridlayouts";
import type { LayoutProps } from "./Layouttypes";
import styles from "./public.module.css"

// ─── Layout Clásica — Tienda polished, nav horizontal limpio ─────────────────
export default function LayoutClasica({
  emp,
  tema,
  images,
  activeImg,
  setActiveImg,
  productosActivos,
  isPro,
  gridProps,
  onContactWA,
  onContactIG,
  onContactWeb,
}: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: tema.bg, color: tema.text }}>
      {/* ── NAV ── sticky, limpio, logo izquierda + links derecha */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: tema.card,
          borderBottom: `1px solid ${tema.border}`,
          padding: "0 5vw",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/directorio"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: tema.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            {emp.nombre.charAt(0).toUpperCase()}
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: tema.text,
              letterSpacing: -0.3,
            }}
          >
            {emp.nombre}
          </span>
        </Link>

        {/* Links centro */}
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {emp.whatsapp && (
            <button
              onClick={onContactWA}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: tema.muted,
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              Contacto
            </button>
          )}
          {emp.instagram && (
            <button
              onClick={onContactIG}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: tema.muted,
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              Instagram
            </button>
          )}
          {emp.ubicacion && (
            <span style={{ fontSize: 12, color: tema.muted }}>
              📍 {emp.ubicacion}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/directorio"
          style={{
            background: tema.accent,
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Directorio
        </Link>
      </nav>

      {/* ── HERO ── banner con nombre + tagline sobre imagen de fondo */}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: 320,
          overflow: "hidden",
          background: tema.dark,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {(emp.hero_imagen ?? images[0]) && (
          <Image
            src={emp.hero_imagen ?? images[0]}
            alt={emp.nombre}
            fill
            style={{ objectFit: "cover", opacity: 0.35 }}
            sizes="100vw"
            priority
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${tema.dark} 0%, ${tema.dark}88 50%, ${tema.dark}22 100%)`,
          }}
        />

        {/* Contenido hero */}
        <div
          className={styles.heroContent}
          style={{ position: "relative", zIndex: 1, padding: "48px 5vw" }}
        >
          <div>
            {emp.rubro && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: tema.accent,
                  letterSpacing: 3,
                  textTransform: "uppercase" as const,
                  display: "block",
                  marginBottom: 12,
                }}
              >
                {emp.rubro}
              </span>
            )}
            <h1
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.05,
                marginBottom: 12,
                letterSpacing: -1,
              }}
            >
              {emp.hero_titulo || emp.nombre}
            </h1>
            {emp.tagline && (
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.6,
                  maxWidth: 480,
                }}
              >
                {emp.tagline}
              </p>
            )}
          </div>

          {/* Thumbs de galería si hay más de 1 imagen */}
          {images.length > 1 && (
            <div
              className={styles.heroThumbs}
              style={{ display: "flex", gap: 6 }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: `2px solid ${i === activeImg ? "#fff" : "rgba(255,255,255,0.3)"}`,
                    padding: 0,
                    cursor: "pointer",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="52px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── INFO BAR ── rubro, envíos, contacto rápido */}
      <div
        style={{
          background: tema.card,
          borderBottom: `1px solid ${tema.border}`,
          padding: "14px 5vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap" as const,
        }}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {emp.ubicacion && (
            <span style={{ fontSize: 13, color: tema.muted }}>
              📍 {emp.ubicacion}
            </span>
          )}
          <span style={{ fontSize: 13, color: tema.muted }}>
            {emp.envios ? "🚚 Envíos a todo el país" : "🏪 Solo local"}
          </span>
          {isPro && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tema.accent,
                background: tema.accent + "15",
                padding: "3px 10px",
                borderRadius: 100,
              }}
            >
              ✓ Tienda verificada
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {emp.whatsapp && (
            <button
              onClick={onContactWA}
              style={{
                padding: "8px 16px",
                borderRadius: 100,
                background: "#25D366",
                border: "none",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              💬 WhatsApp
            </button>
          )}
          {emp.instagram && (
            <button
              onClick={onContactIG}
              style={{
                padding: "8px 16px",
                borderRadius: 100,
                background: "transparent",
                border: `1.5px solid ${tema.border}`,
                color: tema.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📷 Instagram
            </button>
          )}
          {emp.web && (
            <button
              onClick={onContactWeb}
              style={{
                padding: "8px 16px",
                borderRadius: 100,
                background: "transparent",
                border: `1.5px solid ${tema.border}`,
                color: tema.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              🌐 Web
            </button>
          )}
        </div>
      </div>

      {/* ── DESCRIPCIÓN ── */}
      {emp.descripcion && (
        <div style={{ padding: "32px 5vw 0", maxWidth: 680 }}>
          <p style={{ fontSize: 15, color: tema.muted, lineHeight: 1.8 }}>
            {emp.descripcion}
          </p>
        </div>
      )}

      {/* ── PRODUCTOS ── */}
      {productosActivos.length > 0 && (
        <div style={{ padding: "40px 5vw 64px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: tema.text,
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}
              >
                Catálogo
              </h2>
              <p style={{ fontSize: 13, color: tema.muted }}>
                {productosActivos.length} producto
                {productosActivos.length !== 1 ? "s" : ""} disponible
                {productosActivos.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isPro && (
              <span
                style={{
                  fontSize: 11,
                  color: tema.accent,
                  background: tema.accent + "15",
                  padding: "5px 14px",
                  borderRadius: 100,
                  fontWeight: 700,
                }}
              >
                Pago online disponible
              </span>
            )}
          </div>
          <GridClasica {...gridProps} />
        </div>
      )}

      {/* ── FOOTER ── */}
      <div
        style={{
          borderTop: `1px solid ${tema.border}`,
          padding: "24px 5vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p style={{ fontSize: 12, color: tema.muted }}>
          ✦ Emprendimiento verificado en
        </p>
        <Link
          href="/directorio"
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: tema.accent,
            textDecoration: "none",
          }}
        >
          Viko.
        </Link>
      </div>
    </div>
  );
}
