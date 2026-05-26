"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GridPremium } from "./Gridlayouts";
import type { LayoutProps } from "./Layouttypes";

// ─── Layout Premium — Dark luxury, nav transparente, hero full-screen ─────────
export default function LayoutPremium({
  emp,
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
  const GOLD = "#C9A84C";
  const GOLD_DIM = "rgba(201,168,76,0.35)";

  return (
    <div style={{ minHeight: "100vh", background: "#060606", color: "#fff" }}>
      {/* ── NAV ── transparente, oscuro, logo dorado */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 5vw",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
          backdropFilter: "blur(8px)",
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
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
            }}
          >
            ✦ Viko
          </span>
        </Link>

        {/* Nombre emprendimiento centrado */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {emp.nombre}
        </span>

        {/* Links derecha */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {emp.instagram && (
            <button
              onClick={onContactIG}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "inherit",
                letterSpacing: 1,
                textTransform: "uppercase" as const,
              }}
            >
              Instagram
            </button>
          )}
          {emp.whatsapp && (
            <button
              onClick={onContactWA}
              style={{
                padding: "7px 18px",
                borderRadius: 100,
                background: "transparent",
                border: `1px solid ${GOLD_DIM}`,
                color: GOLD,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 1,
              }}
            >
              Contacto
            </button>
          )}
        </div>
      </nav>

      {/* ── HERO ── full-screen imagen, texto centrado */}
      <div
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {(emp.hero_imagen ?? images[0]) ? (
          <Image
            src={emp.hero_imagen ?? images[0]}
            alt={emp.nombre}
            fill
            style={{ objectFit: "cover", opacity: 0.5 }}
            sizes="100vw"
            priority
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#111" }} />
        )}
        {/* Overlay gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        {/* Línea dorada superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />

        {/* Texto centrado */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            padding: "0 5vw",
          }}
        >
          {emp.rubro && (
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: GOLD,
                letterSpacing: 5,
                textTransform: "uppercase" as const,
                marginBottom: 20,
              }}
            >
              {emp.rubro}
            </p>
          )}
          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.0,
              letterSpacing: -2,
              marginBottom: 20,
            }}
          >
            {emp.hero_titulo || emp.nombre}
          </h1>
          {emp.tagline && (
            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                maxWidth: 520,
                margin: "0 auto 36px",
              }}
            >
              {emp.tagline}
            </p>
          )}

          {/* Botones hero */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap" as const,
            }}
          >
            {emp.whatsapp && (
              <button
                onClick={onContactWA}
                style={{
                  padding: "13px 32px",
                  borderRadius: 100,
                  background: GOLD,
                  border: "none",
                  color: "#060606",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: 0.5,
                }}
              >
                Contactar
              </button>
            )}
            <button
              onClick={() => {
                const el = document.getElementById("coleccion");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                padding: "13px 32px",
                borderRadius: 100,
                background: "transparent",
                border: `1px solid rgba(255,255,255,0.3)`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Ver colección ↓
            </button>
          </div>
        </div>

        {/* Galería thumbnails abajo */}
        {images.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
            }}
          >
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: `1.5px solid ${i === activeImg ? GOLD : "rgba(255,255,255,0.2)"}`,
                  padding: 0,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="44px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Info ubicación bottom left */}
        {emp.ubicacion && (
          <div
            style={{
              position: "absolute",
              bottom: 36,
              left: "5vw",
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 2,
            }}
          >
            📍 {emp.ubicacion.toUpperCase()}
          </div>
        )}
      </div>

      {/* ── COLECCIÓN ── */}
      {productosActivos.length > 0 && (
        <div id="coleccion" style={{ padding: "80px 5vw 80px" }}>
          {/* Header sección */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 48,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: GOLD,
                  letterSpacing: 5,
                  textTransform: "uppercase" as const,
                  marginBottom: 8,
                }}
              >
                ✦ Colección exclusiva
              </p>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: -0.5,
                }}
              >
                {isPro ? "Tienda" : "Productos"}
              </h2>
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.08)",
              }}
            />
          </div>

          <GridPremium {...gridProps} />
        </div>
      )}

      {/* ── INFO EXTRA ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "48px 5vw",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
        }}
      >
        {emp.descripcion && (
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: GOLD,
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                marginBottom: 12,
              }}
            >
              Nosotros
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.8,
              }}
            >
              {emp.descripcion}
            </p>
          </div>
        )}
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              marginBottom: 12,
            }}
          >
            Contacto
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {emp.whatsapp && (
              <button
                onClick={onContactWA}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                💬 WhatsApp
              </button>
            )}
            {emp.instagram && (
              <button
                onClick={onContactIG}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                📷 @{emp.instagram}
              </button>
            )}
            {emp.web && (
              <button
                onClick={onContactWeb}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                🌐 Sitio web
              </button>
            )}
          </div>
        </div>
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              marginBottom: 12,
            }}
          >
            Detalles
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.8,
            }}
          >
            {emp.ubicacion && `📍 ${emp.ubicacion}\n`}
            {emp.envios ? "🚚 Envíos a todo el país" : "🏪 Solo local"}
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.04)",
          padding: "20px 5vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: 2,
          }}
        >
          ✦ VERIFICADO EN
        </span>
        <Link
          href="/directorio"
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: GOLD,
            textDecoration: "none",
            letterSpacing: 1,
          }}
        >
          VIKO.
        </Link>
      </div>
    </div>
  );
}
