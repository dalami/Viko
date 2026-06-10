"use client";

import React from "react";
import Image from "next/image";
import type { Producto } from "../../../../lib/types";
import { getTema } from "../../../../lib/plantillas";
import styles from "./public.module.css";
import { useState } from "react";

function ZoomableImage({
  src,
  alt,
  sizes,
  style,
}: {
  src: string;
  alt: string;
  sizes?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        onClick={() => setOpen(true)}
        style={{
          cursor: "zoom-in",
          ...style,
        }}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.95)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw",
              maxHeight: "95vh",
              objectFit: "contain",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Tema = ReturnType<typeof getTema>;

export interface GridProps {
  productos: Producto[];
  isPro: boolean;
  tema: Tema;
  onAgregar: (p: Producto, v?: { tipo: string; opcion: string }) => void;
  onConsultar: (p: Producto) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function descuento(p: Producto) {
  return p.precio_descuento && p.precio_descuento < p.precio
    ? Math.round((1 - p.precio_descuento / p.precio) * 100)
    : 0;
}

export function BadgesProducto({ p }: { p: Producto }) {
  const pct = descuento(p);
  return (
    <div
      style={{
        position: "absolute",
        top: 6,
        left: 6,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {pct > 0 && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            background: "#C4664A",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 100,
          }}
        >
          -{pct}% OFF
        </span>
      )}
      {p.stock !== undefined &&
        p.stock !== null &&
        p.stock <= 5 &&
        p.stock > 0 && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: "#C9A84C",
              color: "#1A1814",
              padding: "2px 6px",
              borderRadius: 100,
            }}
          >
            ¡Últimos {p.stock}!
          </span>
        )}
    </div>
  );
}

export function PrecioProducto({
  p,
  tema,
  size = 15,
}: {
  p: Producto;
  tema: Tema;
  size?: number;
}) {
  const pct = descuento(p);
  const precioFinal = pct > 0 ? p.precio_descuento! : p.precio;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          color: pct > 0 ? "#C4664A" : tema.accent,
        }}
      >
        ${Number(precioFinal).toLocaleString("es-AR")}
      </span>
      {pct > 0 && (
        <span
          style={{
            fontSize: size - 3,
            color: tema.muted,
            textDecoration: "line-through",
          }}
        >
          ${Number(p.precio).toLocaleString("es-AR")}
        </span>
      )}
    </div>
  );
}

// ─── Variante Selector ────────────────────────────────────────────────────────
export function VarianteSelector({
  producto,
  onAgregar,
  onConsultar,
  isPro,
  accentColor,
  borderColor,
}: {
  producto: Producto;
  onAgregar: (v?: { tipo: string; opcion: string }) => void;
  onConsultar: () => void;
  isPro: boolean;
  accentColor: string;
  borderColor: string;
}) {
  const variantes = producto.variantes ?? [];
  const [selecciones, setSelecciones] = React.useState<Record<string, string>>(
    {},
  );
  const [open, setOpen] = React.useState(false);
  const todasSeleccionadas = variantes.every((v) => selecciones[v.tipo]);

  function handleAgregar() {
    if (!isPro) {
      onConsultar();
      return;
    }
    if (variantes.length === 0) {
      onAgregar();
      return;
    }
    if (!open) {
      setOpen(true);
      return;
    }
    if (!todasSeleccionadas) return;
    const [primera] = variantes;
    onAgregar({ tipo: primera.tipo, opcion: selecciones[primera.tipo] });
    setOpen(false);
    setSelecciones({});
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {open &&
        variantes.map((v) => (
          <div key={v.tipo}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: accentColor,
                marginBottom: 4,
                textTransform: "uppercase" as const,
              }}
            >
              {v.tipo}
            </p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
              {v.opciones.map((op) => (
                <button
                  key={op}
                  onClick={() =>
                    setSelecciones((p) => ({ ...p, [v.tipo]: op }))
                  }
                  style={{
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    border: `1.5px solid ${selecciones[v.tipo] === op ? accentColor : borderColor}`,
                    background:
                      selecciones[v.tipo] === op ? accentColor : "transparent",
                    color: selecciones[v.tipo] === op ? "#fff" : accentColor,
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        ))}
      <div style={{ display: "flex", gap: 6 }}>
        {isPro ? (
          <button
            className={styles.productoWa}
            onClick={handleAgregar}
            disabled={open && variantes.length > 0 && !todasSeleccionadas}
            style={{
              flex: 1,
              borderColor: accentColor,
              color: accentColor,
              opacity:
                open && variantes.length > 0 && !todasSeleccionadas ? 0.5 : 1,
            }}
          >
            {open && variantes.length > 0
              ? todasSeleccionadas
                ? "✓ Agregar"
                : "Elegí opción"
              : variantes.length > 0
                ? "Elegir opciones"
                : "🛍️ Agregar"}
          </button>
        ) : (
          <button
            className={styles.productoWa}
            onClick={onConsultar}
            style={{ flex: 1, borderColor: accentColor, color: accentColor }}
          >
            Consultar →
          </button>
        )}
        {open && (
          <button
            onClick={() => {
              setOpen(false);
              setSelecciones({});
            }}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              border: `1.5px solid ${borderColor}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              color: accentColor,
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 1. CLÁSICA — Bento asimétrico ───────────────────────────────────────────
export function GridClasica({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  const [hero, ...resto] = productos;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {hero && (
        <div
          className={styles.clasicaHero}
          style={{
            border: `1px solid ${tema.border}`,
            overflow: "hidden",
          }}
        >
          <div
            className={styles.clasicaHeroImg}
            style={{ position: "relative", background: tema.bg }}
          >
            {hero.imagen ? (
              <Image
                src={hero.imagen}
                alt={hero.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="50vw"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                  background: tema.accent + "12",
                }}
              >
                🛍️
              </div>
            )}
            <BadgesProducto p={hero} />
          </div>
          <div
            style={{
              padding: "52px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: tema.bg,
            }}
          >
            <div>
              {hero.categoria && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: tema.accent,
                    letterSpacing: 4,
                    textTransform: "uppercase" as const,
                    marginBottom: 18,
                  }}
                >
                  {hero.categoria}
                </p>
              )}
              <p
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: tema.text,
                  lineHeight: 1.05,
                  marginBottom: 16,
                  letterSpacing: -0.5,
                }}
              >
                {hero.nombre}
              </p>
              {hero.descripcion && (
                <p
                  style={{
                    fontSize: 15,
                    color: tema.muted,
                    lineHeight: 1.8,
                    marginBottom: 24,
                  }}
                >
                  {hero.descripcion}
                </p>
              )}
            </div>
            <div>
              <PrecioProducto p={hero} tema={tema} size={28} />
              <div style={{ marginTop: 20 }}>
                <VarianteSelector
                  producto={hero}
                  isPro={isPro}
                  accentColor={tema.accent}
                  borderColor={tema.border}
                  onAgregar={(v) => onAgregar(hero, v)}
                  onConsultar={() => onConsultar(hero)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 2,
        }}
      >
        {resto.map((p) => (
          <div
            key={p.id}
            style={{
              background: tema.card,
              border: `1px solid ${tema.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1" as const,
                background: tema.bg,
              }}
            >
              {p.imagen ? (
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="30vw"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                  }}
                >
                  🛍️
                </div>
              )}
              <BadgesProducto p={p} />
            </div>
            <div
              style={{
                padding: "16px 18px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: tema.text,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {p.nombre}
                </p>
                <PrecioProducto p={p} tema={tema} size={16} />
              </div>
              <VarianteSelector
                producto={p}
                isPro={isPro}
                accentColor={tema.accent}
                borderColor={tema.border}
                onAgregar={(v) => onAgregar(p, v)}
                onConsultar={() => onConsultar(p)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. TIENDA — Cards con hover elevado y precio flotante ───────────────────
export function GridTienda({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {productos.map((p) => {
        const pct = descuento(p);
        const precioFinal = pct > 0 ? p.precio_descuento! : p.precio;
        return (
          <div
            key={p.id}
            style={{
              background: tema.card,
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${tema.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "transform 0.22s ease, box-shadow 0.22s ease",
            }}
            onMouseEnter={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.transform = "translateY(-5px)";
              d.style.boxShadow = "0 16px 40px rgba(0,0,0,0.13)";
            }}
            onMouseLeave={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.transform = "translateY(0)";
              d.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "100%",
                background: tema.bg,
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                {p.imagen ? (
                  <ZoomableImage
                    src={p.imagen}
                    alt={p.nombre}
                    sizes="240px"
                    style={{ objectFit: "cover" }}
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
                    🛍️
                  </div>
                )}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  background: tema.card,
                  borderRadius: 100,
                  padding: "5px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: pct > 0 ? "#C4664A" : tema.accent,
                  }}
                >
                  ${Number(precioFinal).toLocaleString("es-AR")}
                </span>
                {pct > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: "#C4664A",
                      color: "#fff",
                      padding: "1px 6px",
                      borderRadius: 100,
                    }}
                  >
                    -{pct}%
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                padding: "16px 18px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: tema.text,
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {p.nombre}
                </p>
                {p.descripcion && (
                  <p
                    style={
                      {
                        fontSize: 12,
                        color: tema.muted,
                        lineHeight: 1.6,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      } as React.CSSProperties
                    }
                  >
                    {p.descripcion}
                  </p>
                )}
              </div>
              {p.tags && p.tags.length > 0 && (
                <div
                  style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}
                >
                  {p.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: tema.accent + "18",
                        color: tema.accent,
                        fontWeight: 700,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <VarianteSelector
                producto={p}
                isPro={isPro}
                accentColor={tema.accent}
                borderColor={tema.border}
                onAgregar={(v) => onAgregar(p, v)}
                onConsultar={() => onConsultar(p)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 3. STORY — Editorial una columna, imagen 16:9 ───────────────────────────
export function GridStory({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {productos.map((p, i) => (
        <div
          key={p.id}
          style={{
            paddingBottom: 56,
            marginBottom: 56,
            borderBottom:
              i < productos.length - 1 ? `1px solid ${tema.border}` : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: tema.accent,
                letterSpacing: 3,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div style={{ flex: 1, height: 1, background: tema.border }} />
            {p.categoria && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: tema.muted,
                  letterSpacing: 2,
                  textTransform: "uppercase" as const,
                }}
              >
                {p.categoria}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: tema.text,
              lineHeight: 1.05,
              marginBottom: 24,
              letterSpacing: -0.8,
              maxWidth: 680,
            }}
          >
            {p.nombre}
          </p>
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "50%",
              background: tema.bg,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <div style={{ position: "absolute", inset: 0 }}>
              {p.imagen ? (
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="90vw"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 64,
                    background: tema.accent + "10",
                  }}
                >
                  🛍️
                </div>
              )}
            </div>
          </div>
          {p.descripcion && (
            <p
              style={{
                fontSize: 16,
                color: tema.muted,
                lineHeight: 1.85,
                maxWidth: 620,
                marginBottom: 28,
              }}
            >
              {p.descripcion}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap" as const,
            }}
          >
            <PrecioProducto p={p} tema={tema} size={24} />
            <div style={{ minWidth: 200 }}>
              <VarianteSelector
                producto={p}
                isPro={isPro}
                accentColor={tema.accent}
                borderColor={tema.border}
                onAgregar={(v) => onAgregar(p, v)}
                onConsultar={() => onConsultar(p)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 4. BOLD — Brutalista: bloques imagen + tipografía XL ────────────────────
export function GridBold({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 4,
      }}
    >
      {productos.map((p, i) => {
        const pct = descuento(p);
        return (
          <div
            key={p.id}
            style={{
              position: "relative",
              minHeight: 380,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: tema.dark,
            }}
          >
            {p.imagen && (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover", opacity: 0.42 }}
                sizes="33vw"
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(145deg, ${tema.dark}dd 0%, ${tema.dark}66 100%)`,
              }}
            />
            <div
              style={{
                position: "relative",
                padding: "18px 20px 0",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: 88,
                  fontWeight: 900,
                  color: "#fff",
                  opacity: 0.07,
                  lineHeight: 1,
                  letterSpacing: -4,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div style={{ position: "relative", padding: "0 26px 26px" }}>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1.1,
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}
              >
                {p.nombre}
              </p>
              {p.descripcion && (
                <p
                  style={
                    {
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.6,
                      marginBottom: 14,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    } as React.CSSProperties
                  }
                >
                  {p.descripcion}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>
                  $
                  {Number(
                    pct > 0 ? p.precio_descuento! : p.precio,
                  ).toLocaleString("es-AR")}
                </span>
                {pct > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#C4664A",
                      color: "#fff",
                      padding: "3px 10px",
                      borderRadius: 100,
                    }}
                  >
                    -{pct}%
                  </span>
                )}
              </div>
              <VarianteSelector
                producto={p}
                isPro={isPro}
                accentColor="#fff"
                borderColor="rgba(255,255,255,0.28)"
                onAgregar={(v) => onAgregar(p, v)}
                onConsultar={() => onConsultar(p)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 5. MINIMALISTA — Lista numerada de lujo ─────────────────────────────────
export function GridMinimalista({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {productos.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "grid",
            gridTemplateColumns: "72px 1fr auto",
            gap: 28,
            alignItems: "center",
            padding: "30px 0",
            borderBottom:
              i < productos.length - 1 ? `1px solid ${tema.border}` : "none",
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: tema.accent,
              opacity: 0.18,
              lineHeight: 1,
              textAlign: "right" as const,
              letterSpacing: -2,
              userSelect: "none" as const,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: tema.text,
                marginBottom: 5,
                lineHeight: 1.3,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p style={{ fontSize: 13, color: tema.muted, lineHeight: 1.65 }}>
                {p.descripcion}
              </p>
            )}
            {p.tags && p.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap" as const,
                  marginTop: 10,
                }}
              >
                {p.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10,
                      padding: "2px 9px",
                      borderRadius: 100,
                      background: tema.accent + "14",
                      color: tema.accent,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 14,
              minWidth: 170,
            }}
          >
            <PrecioProducto p={p} tema={tema} size={20} />
            <div style={{ width: "100%" }}>
              <VarianteSelector
                producto={p}
                isPro={isPro}
                accentColor={tema.accent}
                borderColor={tema.border}
                onAgregar={(v) => onAgregar(p, v)}
                onConsultar={() => onConsultar(p)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 6. CATÁLOGO — Tarjetas horizontales detalladas ──────────────────────────
export function GridCatalogo({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {productos.map((p) => (
        <div
          key={p.id}
          className={styles.catalogoCard}
          style={{
            border: `1px solid ${tema.border}`,
            background: tema.card,
          }}
        >
          <div
            className={styles.catalogoCardImg}
            style={{ position: "relative", background: tema.bg }}
          >
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="240px"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  background: tema.accent + "10",
                }}
              >
                🛍️
              </div>
            )}
            <BadgesProducto p={p} />
          </div>
          <div
            style={{
              padding: "28px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {p.categoria && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: tema.accent,
                    letterSpacing: 3,
                    textTransform: "uppercase" as const,
                    marginBottom: 10,
                  }}
                >
                  {p.categoria}
                </p>
              )}
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: tema.text,
                  lineHeight: 1.2,
                  marginBottom: 10,
                }}
              >
                {p.nombre}
              </p>
              {p.descripcion && (
                <p
                  style={{
                    fontSize: 14,
                    color: tema.muted,
                    lineHeight: 1.75,
                    marginBottom: 14,
                  }}
                >
                  {p.descripcion}
                </p>
              )}
              {p.tags && p.tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap" as const,
                    marginBottom: 12,
                  }}
                >
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 100,
                        background: tema.accent + "14",
                        color: tema.accent,
                        fontWeight: 600,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {p.stock !== undefined && p.stock !== null && (
                <p
                  style={{
                    fontSize: 12,
                    color:
                      p.stock === 0
                        ? "#C4664A"
                        : p.stock <= 5
                          ? "#C9A84C"
                          : tema.muted,
                    marginBottom: 4,
                  }}
                >
                  {p.stock === 0
                    ? "❌ Sin stock"
                    : p.stock <= 5
                      ? `⚠️ Últimas ${p.stock} unidades`
                      : "✓ En stock"}
                </p>
              )}
            </div>
            <div>
              <div style={{ marginBottom: 14 }}>
                <PrecioProducto p={p} tema={tema} size={24} />
              </div>
              <VarianteSelector
                producto={p}
                isPro={isPro}
                accentColor={tema.accent}
                borderColor={tema.border}
                onAgregar={(v) => onAgregar(p, v)}
                onConsultar={() => onConsultar(p)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 7. REVISTA — Paneles alternados full-bleed ───────────────────────────────
export function GridRevista({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {productos.map((p, i) => (
        <div key={p.id} className={styles.revistaRow}>
          <div
            className={styles.revistaImg}
            data-order={i % 2 === 0 ? "0" : "1"}
            style={{
              position: "relative",
              background: tema.bg,
            }}
          >
            {p.imagen ? (
              <ZoomableImage
                src={p.imagen}
                alt={p.nombre}
                sizes="50vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 60,
                  background: tema.accent + "12",
                }}
              >
                🛍️
              </div>
            )}
          </div>
          <div
            className={styles.revistaInfo}
            data-order={i % 2 === 0 ? "1" : "0"}
            style={{
              background: i % 2 === 0 ? tema.bg : tema.card,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: tema.accent,
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: tema.accent,
                  letterSpacing: 3,
                  textTransform: "uppercase" as const,
                }}
              >
                {p.categoria || "Destacado"}
              </p>
            </div>
            <p
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: tema.text,
                lineHeight: 1.1,
                marginBottom: 18,
                letterSpacing: -0.5,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                style={{
                  fontSize: 15,
                  color: tema.muted,
                  lineHeight: 1.8,
                  marginBottom: 30,
                }}
              >
                {p.descripcion}
              </p>
            )}
            <div style={{ marginBottom: 26 }}>
              <PrecioProducto p={p} tema={tema} size={28} />
            </div>
            <VarianteSelector
              producto={p}
              isPro={isPro}
              accentColor={tema.accent}
              borderColor={tema.border}
              onAgregar={(v) => onAgregar(p, v)}
              onConsultar={() => onConsultar(p)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 8. PORTFOLIO — Masonry oscuro ────────────────────────────────────────────
export function GridPortfolio({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  const heights = ["130%", "88%", "110%", "78%", "100%", "120%"];
  return (
    <div style={{ background: tema.dark, padding: 20, borderRadius: 16 }}>
      <div style={{ columns: 2, gap: 8 }}>
        {productos.map((p, i) => (
          <div key={p.id} style={{ breakInside: "avoid", marginBottom: 8 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: heights[i % heights.length],
                overflow: "hidden",
                borderRadius: 8,
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                {p.imagen ? (
                  <Image
                    src={p.imagen}
                    alt={p.nombre}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="45vw"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      background: tema.accent + "20",
                    }}
                  >
                    🛍️
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "18px 16px",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 4,
                    lineHeight: 1.25,
                  }}
                >
                  {p.nombre}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}
                  >
                    $
                    {Number(
                      descuento(p) > 0 ? p.precio_descuento! : p.precio,
                    ).toLocaleString("es-AR")}
                  </span>
                  <div style={{ maxWidth: 110 }}>
                    <VarianteSelector
                      producto={p}
                      isPro={isPro}
                      accentColor="#fff"
                      borderColor="rgba(255,255,255,0.35)"
                      onAgregar={(v) => onAgregar(p, v)}
                      onConsultar={() => onConsultar(p)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 9. PREMIUM — Tiles cinematográficos de lujo ─────────────────────────────
export function GridPremium({
  productos,
  isPro,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 3,
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            position: "relative",
            minHeight: 440,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            background: "#060606",
          }}
        >
          {p.imagen && (
            <Image
              src={p.imagen}
              alt={p.nombre}
              fill
              style={{ objectFit: "cover", opacity: 0.6 }}
              sizes="33vw"
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.38) 55%, transparent 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent 0%, #C9A84C 40%, #C9A84C 60%, transparent 100%)",
            }}
          />
          <div
            style={{ position: "relative", padding: "30px 26px", zIndex: 1 }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#C9A84C",
                letterSpacing: 4,
                textTransform: "uppercase" as const,
                marginBottom: 12,
              }}
            >
              ✦ {p.categoria || "Exclusivo"}
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                style={
                  {
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.65,
                    marginBottom: 18,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  } as React.CSSProperties
                }
              >
                {p.descripcion}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 900, color: "#C9A84C" }}>
                $
                {Number(
                  descuento(p) > 0 ? p.precio_descuento! : p.precio,
                ).toLocaleString("es-AR")}
              </span>
              {descuento(p) > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#C9A84C",
                    border: "1px solid rgba(201,168,76,0.4)",
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  -{descuento(p)}% OFF
                </span>
              )}
            </div>
            <VarianteSelector
              producto={p}
              isPro={isPro}
              accentColor="#C9A84C"
              borderColor="rgba(201,168,76,0.32)"
              onAgregar={(v) => onAgregar(p, v)}
              onConsultar={() => onConsultar(p)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 10. MERCADO — Grid ultra-denso ──────────────────────────────────────────
export function GridMercado({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
        gap: 6,
      }}
    >
      {productos.map((p) => {
        const pct = descuento(p);
        const precioFinal = pct > 0 ? p.precio_descuento! : p.precio;
        return (
          <div
            key={p.id}
            style={{
              background: tema.card,
              borderRadius: 12,
              border: `1px solid ${tema.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "88%",
                background: tema.bg,
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                {p.imagen ? (
                  <Image
                    src={p.imagen}
                    alt={p.nombre}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="18vw"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                    }}
                  >
                    🛍️
                  </div>
                )}
              </div>
              {pct > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#C4664A",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 100,
                  }}
                >
                  -{pct}%
                </div>
              )}
            </div>
            <div
              style={{
                padding: "8px 10px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <p
                style={
                  {
                    fontSize: 12,
                    fontWeight: 600,
                    color: tema.text,
                    lineHeight: 1.3,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  } as React.CSSProperties
                }
              >
                {p.nombre}
              </p>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: pct > 0 ? "#C4664A" : tema.accent,
                    }}
                  >
                    ${Number(precioFinal).toLocaleString("es-AR")}
                  </span>
                  {pct > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: tema.muted,
                        textDecoration: "line-through",
                      }}
                    >
                      ${Number(p.precio).toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
                <VarianteSelector
                  producto={p}
                  isPro={isPro}
                  accentColor={tema.accent}
                  borderColor={tema.border}
                  onAgregar={(v) => onAgregar(p, v)}
                  onConsultar={() => onConsultar(p)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── BENTO — Grilla asimétrica tipo Apple ─────────────────────────────────────
export function GridBento({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  // Patrón bento: [grande 2col] [medio] [medio] [pequeño] [pequeño] [pequeño] ...
  const patrones = [
    { colSpan: 2, rowSpan: 2, minH: 400 }, // 0: grande
    { colSpan: 1, rowSpan: 1, minH: 190 }, // 1: medio
    { colSpan: 1, rowSpan: 1, minH: 190 }, // 2: medio
    { colSpan: 1, rowSpan: 1, minH: 190 }, // 3: pequeño
    { colSpan: 1, rowSpan: 1, minH: 190 }, // 4: pequeño
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        gridAutoRows: "190px",
      }}
    >
      {productos.map((p, i) => {
        const patron = patrones[i % patrones.length];
        const isGrande = i % 5 === 0;
        const pct = descuento(p);
        const precioFinal = pct > 0 ? p.precio_descuento! : p.precio;
        return (
          <div
            key={p.id}
            style={{
              gridColumn: isGrande ? "span 2" : "span 1",
              gridRow: isGrande ? "span 2" : "span 1",
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              background: tema.card,
              border: `1px solid ${tema.border}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              minHeight: patron.minH,
            }}
          >
            {p.imagen && (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover", opacity: isGrande ? 0.75 : 0.85 }}
                sizes={isGrande ? "66vw" : "33vw"}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, ${tema.dark}ee 0%, ${tema.dark}44 55%, transparent 100%)`,
              }}
            />
            <div
              style={{
                position: "relative",
                padding: isGrande ? "24px 28px" : "14px 16px",
                zIndex: 1,
              }}
            >
              <p
                style={{
                  fontSize: isGrande ? 22 : 13,
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.2,
                  marginBottom: isGrande ? 8 : 4,
                }}
              >
                {p.nombre}
              </p>
              {isGrande && p.descripcion && (
                <p
                  style={
                    {
                      fontSize: 13,
                      color: "rgba(255,255,255,0.65)",
                      lineHeight: 1.6,
                      marginBottom: 14,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    } as React.CSSProperties
                  }
                >
                  {p.descripcion}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: isGrande ? 14 : 8,
                }}
              >
                <span
                  style={{
                    fontSize: isGrande ? 22 : 15,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  ${Number(precioFinal).toLocaleString("es-AR")}
                </span>
                {pct > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: "#C4664A",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 100,
                    }}
                  >
                    -{pct}%
                  </span>
                )}
              </div>
              {isGrande && (
                <VarianteSelector
                  producto={p}
                  isPro={isPro}
                  accentColor="#fff"
                  borderColor="rgba(255,255,255,0.3)"
                  onAgregar={(v) => onAgregar(p, v)}
                  onConsultar={() => onConsultar(p)}
                />
              )}
              {!isGrande && (
                <button
                  onClick={() => onConsultar(p)}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 100,
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {isPro ? "🛍️ Agregar" : "Consultar →"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── LOOKBOOK — Editorial de moda: hero izquierda + strip derecha ───────────────
export function GridLookbook({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  const chunks: Producto[][] = [];
  for (let i = 0; i < productos.length; i += 4) {
    chunks.push(productos.slice(i, i + 4));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {chunks.map((chunk, ci) => {
        const [principal, ...resto] = chunk;
        const izqDer = ci % 2 === 0;
        if (!principal) return null;
        return (
          <div
            key={ci}
            style={{
              display: "grid",
              gridTemplateColumns: izqDer ? "1.6fr 1fr" : "1fr 1.6fr",
              gap: 4,
              minHeight: 560,
            }}
          >
            {/* Hero */}
            <div
              style={{
                order: izqDer ? 0 : 1,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                background: tema.bg,
              }}
            >
              {principal.imagen ? (
                <Image
                  src={principal.imagen}
                  alt={principal.nombre}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="60vw"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 72,
                    background: tema.accent + "10",
                  }}
                >
                  🛍️
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  padding: "32px 36px",
                  zIndex: 1,
                }}
              >
                {principal.categoria && (
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: 3,
                      textTransform: "uppercase" as const,
                      marginBottom: 8,
                    }}
                  >
                    {principal.categoria}
                  </p>
                )}
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1.1,
                    marginBottom: 10,
                  }}
                >
                  {principal.nombre}
                </p>
                {principal.descripcion && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.65)",
                      lineHeight: 1.6,
                      marginBottom: 18,
                    }}
                  >
                    {principal.descripcion}
                  </p>
                )}
                <div style={{ marginBottom: 18 }}>
                  <span
                    style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}
                  >
                    $
                    {Number(
                      descuento(principal) > 0
                        ? principal.precio_descuento!
                        : principal.precio,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
                <VarianteSelector
                  producto={principal}
                  isPro={isPro}
                  accentColor="#fff"
                  borderColor="rgba(255,255,255,0.3)"
                  onAgregar={(v) => onAgregar(principal, v)}
                  onConsultar={() => onConsultar(principal)}
                />
              </div>
            </div>
            {/* Strip de 3 */}
            <div
              style={{
                order: izqDer ? 1 : 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {resto.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    background: tema.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                  }}
                >
                  🛍️
                </div>
              ) : (
                resto.map((p) => {
                  const pct = descuento(p);
                  return (
                    <div
                      key={p.id}
                      style={{
                        flex: 1,
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        background: tema.bg,
                      }}
                    >
                      {p.imagen && (
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="40vw"
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)",
                        }}
                      />
                      <div
                        style={{
                          position: "relative",
                          padding: "14px 18px",
                          zIndex: 1,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#fff",
                            marginBottom: 4,
                            lineHeight: 1.2,
                          }}
                        >
                          {p.nombre}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 900,
                              color: "#fff",
                            }}
                          >
                            $
                            {Number(
                              pct > 0 ? p.precio_descuento! : p.precio,
                            ).toLocaleString("es-AR")}
                          </span>
                          <button
                            onClick={() => onConsultar(p)}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#fff",
                              background: "rgba(255,255,255,0.18)",
                              border: "1px solid rgba(255,255,255,0.3)",
                              borderRadius: 100,
                              padding: "4px 12px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {isPro ? "Agregar" : "Consultar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── HERO — Primer producto pantalla completa, resto en strip ──────────────────
export function GridHero({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  const [hero, ...resto] = productos;
  const pctHero = hero ? descuento(hero) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Hero gigante */}
      {hero && (
        <div
          style={{
            position: "relative",
            minHeight: 520,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
            background: tema.dark,
          }}
        >
          {hero.imagen && (
            <Image
              src={hero.imagen}
              alt={hero.nombre}
              fill
              style={{ objectFit: "cover", opacity: 0.55 }}
              sizes="100vw"
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to top, ${tema.dark}f0 0%, ${tema.dark}44 60%, transparent 100%)`,
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: "56px 5vw",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 40,
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <div>
              {hero.categoria && (
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: tema.accent,
                    letterSpacing: 4,
                    textTransform: "uppercase" as const,
                    marginBottom: 14,
                  }}
                >
                  {hero.categoria}
                </p>
              )}
              <p
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1.0,
                  marginBottom: 16,
                  letterSpacing: -1.5,
                }}
              >
                {hero.nombre}
              </p>
              {hero.descripcion && (
                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.7,
                    maxWidth: 520,
                    marginBottom: 28,
                  }}
                >
                  {hero.descripcion}
                </p>
              )}
              <VarianteSelector
                producto={hero}
                isPro={isPro}
                accentColor="#fff"
                borderColor="rgba(255,255,255,0.3)"
                onAgregar={(v) => onAgregar(hero, v)}
                onConsultar={() => onConsultar(hero)}
              />
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {pctHero > 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "line-through",
                    marginBottom: 4,
                  }}
                >
                  ${Number(hero.precio).toLocaleString("es-AR")}
                </p>
              )}
              <p
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                $
                {Number(
                  pctHero > 0 ? hero.precio_descuento! : hero.precio,
                ).toLocaleString("es-AR")}
              </p>
              {pctHero > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    background: "#C4664A",
                    color: "#fff",
                    padding: "3px 10px",
                    borderRadius: 100,
                    display: "inline-block",
                    marginTop: 8,
                  }}
                >
                  -{pctHero}% OFF
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Strip horizontal del resto */}
      {resto.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(resto.length, 4)}, 1fr)`,
            gap: 4,
          }}
        >
          {resto.map((p) => {
            const pct = descuento(p);
            return (
              <div
                key={p.id}
                style={{
                  position: "relative",
                  minHeight: 280,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  background: tema.bg,
                }}
              >
                {p.imagen && (
                  <Image
                    src={p.imagen}
                    alt={p.nombre}
                    fill
                    style={{ objectFit: "cover", opacity: 0.8 }}
                    sizes="25vw"
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(to top, ${tema.dark}dd 0%, transparent 60%)`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    padding: "14px 16px",
                    zIndex: 1,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#fff",
                      marginBottom: 4,
                      lineHeight: 1.2,
                    }}
                  >
                    {p.nombre}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}
                    >
                      $
                      {Number(
                        pct > 0 ? p.precio_descuento! : p.precio,
                      ).toLocaleString("es-AR")}
                    </span>
                    <button
                      onClick={() => onConsultar(p)}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#fff",
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 100,
                        padding: "4px 12px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {isPro ? "Agregar" : "Ver"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MOSAICO — Tiles de distintos tamaños ─────────────────────────────────────
export function GridMosaico({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  // Patrón de 5 en 5: [2x2] [1x2] [1x1] [1x1] [2x1]
  const sizesPattern = [
    { cols: 2, rows: 2 }, // grande cuadrado
    { cols: 1, rows: 2 }, // alto
    { cols: 1, rows: 1 }, // pequeño
    { cols: 1, rows: 1 }, // pequeño
    { cols: 2, rows: 1 }, // ancho
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "160px",
        gap: 6,
      }}
    >
      {productos.map((p, i) => {
        const size = sizesPattern[i % sizesPattern.length];
        const pct = descuento(p);
        const precioFinal = pct > 0 ? p.precio_descuento! : p.precio;
        const isGrande = size.cols > 1 || size.rows > 1;
        return (
          <div
            key={p.id}
            style={{
              gridColumn: `span ${size.cols}`,
              gridRow: `span ${size.rows}`,
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              background: tema.card,
              border: `1px solid ${tema.border}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover", opacity: 0.8 }}
                sizes={size.cols > 1 ? "50vw" : "25vw"}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  background: tema.accent + "18",
                }}
              >
                🛍️
              </div>
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, ${tema.dark}ee 0%, ${tema.dark}22 60%, transparent 100%)`,
              }}
            />
            {pct > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "#C4664A",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "3px 8px",
                  borderRadius: 100,
                }}
              >
                -{pct}%
              </div>
            )}
            <div
              style={{
                position: "relative",
                padding: isGrande ? "18px 20px" : "10px 12px",
                zIndex: 1,
              }}
            >
              <p
                style={{
                  fontSize: isGrande ? 17 : 12,
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {p.nombre}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: isGrande ? 18 : 14,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  ${Number(precioFinal).toLocaleString("es-AR")}
                </span>
                {isGrande ? (
                  <VarianteSelector
                    producto={p}
                    isPro={isPro}
                    accentColor="#fff"
                    borderColor="rgba(255,255,255,0.3)"
                    onAgregar={(v) => onAgregar(p, v)}
                    onConsultar={() => onConsultar(p)}
                  />
                ) : (
                  <button
                    onClick={() => onConsultar(p)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 100,
                      padding: "3px 10px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isPro ? "+" : "Ver"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── LINEAL — Timeline vertical con línea central ──────────────────────────────
export function GridLineal({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Línea central */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 1,
          background: tema.border,
          transform: "translateX(-50%)",
        }}
      />

      {productos.map((p, i) => {
        const izq = i % 2 === 0;
        return (
          <div
            key={p.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 40px 1fr",
              gap: 0,
              marginBottom: 32,
              alignItems: "center",
            }}
          >
            {/* Lado izquierdo */}
            <div
              style={{
                padding: "0 28px 0 0",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {izq ? (
                <div
                  style={{
                    background: tema.card,
                    border: `1px solid ${tema.border}`,
                    borderRadius: 18,
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: 380,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "56%",
                      background: tema.bg,
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0 }}>
                      {p.imagen ? (
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="40vw"
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
                            background: tema.accent + "10",
                          }}
                        >
                          🛍️
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: tema.text,
                        marginBottom: 6,
                      }}
                    >
                      {p.nombre}
                    </p>
                    {p.descripcion && (
                      <p
                        style={{
                          fontSize: 12,
                          color: tema.muted,
                          lineHeight: 1.6,
                          marginBottom: 12,
                        }}
                      >
                        {p.descripcion}
                      </p>
                    )}
                    <div style={{ marginBottom: 12 }}>
                      <PrecioProducto p={p} tema={tema} size={18} />
                    </div>
                    <VarianteSelector
                      producto={p}
                      isPro={isPro}
                      accentColor={tema.accent}
                      borderColor={tema.border}
                      onAgregar={(v) => onAgregar(p, v)}
                      onConsultar={() => onConsultar(p)}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Punto central + número */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: tema.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `3px solid ${tema.bg}`,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Lado derecho */}
            <div style={{ padding: "0 0 0 28px" }}>
              {!izq ? (
                <div
                  style={{
                    background: tema.card,
                    border: `1px solid ${tema.border}`,
                    borderRadius: 18,
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: 380,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "56%",
                      background: tema.bg,
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0 }}>
                      {p.imagen ? (
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="40vw"
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
                            background: tema.accent + "10",
                          }}
                        >
                          🛍️
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: tema.text,
                        marginBottom: 6,
                      }}
                    >
                      {p.nombre}
                    </p>
                    {p.descripcion && (
                      <p
                        style={{
                          fontSize: 12,
                          color: tema.muted,
                          lineHeight: 1.6,
                          marginBottom: 12,
                        }}
                      >
                        {p.descripcion}
                      </p>
                    )}
                    <div style={{ marginBottom: 12 }}>
                      <PrecioProducto p={p} tema={tema} size={18} />
                    </div>
                    <VarianteSelector
                      producto={p}
                      isPro={isPro}
                      accentColor={tema.accent}
                      borderColor={tema.border}
                      onAgregar={(v) => onAgregar(p, v)}
                      onConsultar={() => onConsultar(p)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
