"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./public.module.css";
import { createClient } from "../../../../lib/supabase";
import { useCart } from "../../../../context/CartContext";
import Image from "next/image";
import { parsePlantilla, getTema } from "../../../../lib/plantillas";
import type { Producto, EmpPublic } from "../../../../lib/types";

interface Props {
  emp: EmpPublic;
  productos: Producto[];
  plantilla?: unknown;
}

type Tema = ReturnType<typeof getTema>;
type GridProps = {
  productos: Producto[];
  isPro: boolean;
  tema: Tema;
  onAgregar: (p: Producto, v?: { tipo: string; opcion: string }) => void;
  onConsultar: (p: Producto) => void;
};

function buildWA(whatsapp: string, texto: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(texto)}`;
}

// ─── Variante Selector ────────────────────────────────────────────────────────
function VarianteSelector({
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
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
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
                textTransform: "uppercase",
              }}
            >
              {v.tipo}
            </p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function descuento(p: Producto) {
  return p.precio_descuento && p.precio_descuento < p.precio
    ? Math.round((1 - p.precio_descuento / p.precio) * 100)
    : 0;
}

function BadgesProducto({ p }: { p: Producto }) {
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

function PrecioProducto({
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

function GridRevista({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {productos.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "grid",
            gridTemplateColumns: i % 2 === 0 ? "1fr 1fr" : "1fr 1fr",
            gap: 0,
            borderBottom: `1px solid ${tema.border}`,
            minHeight: 300,
          }}
        >
          <div style={{ position: "relative", order: i % 2 === 0 ? 0 : 1 }}>
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="50vw"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 300,
                  background: tema.accent + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                }}
              >
                🛍️
              </div>
            )}
          </div>
          <div
            style={{
              padding: "40px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              order: i % 2 === 0 ? 1 : 0,
              background: i % 2 === 0 ? tema.bg : tema.card,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tema.accent,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Producto destacado
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: tema.text,
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                style={{
                  fontSize: 14,
                  color: tema.muted,
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                {p.descripcion}
              </p>
            )}
            <div style={{ marginBottom: 20 }}>
              <PrecioProducto p={p} tema={tema} size={22} />
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

function GridPortfolio({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ columns: "2", gap: 12 }}>
      {productos.map((p, i) => (
        <div
          key={p.id}
          style={{
            breakInside: "avoid",
            marginBottom: 12,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${tema.border}`,
            background: tema.card,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom:
                i % 3 === 0 ? "130%" : i % 3 === 1 ? "80%" : "100%",
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
                    fontSize: 40,
                    background: tema.accent + "15",
                  }}
                >
                  🛍️
                </div>
              )}
            </div>
            <BadgesProducto p={p}  />
          </div>
          <div style={{ padding: "14px 16px" }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: tema.text,
                marginBottom: 4,
              }}
            >
              {p.nombre}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <PrecioProducto p={p} tema={tema} size={15} />
            </div>
            <div style={{ marginTop: 10 }}>
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

function GridPremium({
  productos,
  isPro,
 
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 2,
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            position: "relative",
            minHeight: 380,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            background: "#0A0A0A",
          }}
        >
          {p.imagen && (
            <Image
              src={p.imagen}
              alt={p.nombre}
              fill
              style={{ objectFit: "cover", opacity: 0.7 }}
              sizes="33vw"
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
            }}
          />
          <div
            style={{ position: "relative", padding: "24px 20px", zIndex: 1 }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#C9A84C",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              ✦ Exclusivo
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                {p.descripcion}
              </p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: "#C9A84C" }}>
                $
                {Number(
                  p.precio_descuento && p.precio_descuento < p.precio
                    ? p.precio_descuento
                    : p.precio,
                ).toLocaleString("es-AR")}
              </span>
            </div>
            <VarianteSelector
              producto={p}
              isPro={isPro}
              accentColor="#C9A84C"
              borderColor="rgba(201,168,76,0.4)"
              onAgregar={(v) => onAgregar(p, v)}
              onConsultar={() => onConsultar(p)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridMercado({
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
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 8,
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            background: tema.card,
            borderRadius: 10,
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
              paddingBottom: "100%",
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
                  sizes="20vw"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  🛍️
                </div>
              )}
            </div>
            <BadgesProducto p={p}  />
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
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: tema.text,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {p.nombre}
            </p>
            <div>
              <PrecioProducto p={p} tema={tema} size={14} />
              <div style={{ marginTop: 6 }}>
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
        </div>
      ))}
    </div>
  );
}

// ─── Grids ────────────────────────────────────────────────────────────────────
function GridClasica({
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
        gap: 12,
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            background: tema.card,
            borderRadius: 14,
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
              aspectRatio: "1",
              background: tema.bg,
            }}
          >
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="25vw"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                🛍️
              </div>
            )}
            <BadgesProducto p={p}  />
          </div>
          <div style={{ padding: "10px 12px", flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: tema.text,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                style={{
                  fontSize: 11,
                  color: tema.muted,
                  marginTop: 3,
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {p.descripcion}
              </p>
            )}
            <div style={{ marginTop: 6 }}>
              <PrecioProducto p={p} tema={tema} />
            </div>
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderTop: `1px solid ${tema.border}`,
            }}
          >
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

function GridTienda({
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
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            background: tema.card,
            borderRadius: 16,
            border: `1px solid ${tema.border}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
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
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="33vw"
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
            <BadgesProducto p={p}  />
          </div>
          <div style={{ padding: "14px 16px", flex: 1 }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: tema.text,
                marginBottom: 4,
                lineHeight: 1.3,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                style={{
                  fontSize: 12,
                  color: tema.muted,
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                {p.descripcion}
              </p>
            )}
            <PrecioProducto p={p} tema={tema} size={18} />
            {p.tags && p.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 100,
                      background: tema.accent + "15",
                      color: tema.accent,
                      fontWeight: 600,
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
              padding: "10px 16px",
              borderTop: `1px solid ${tema.border}`,
            }}
          >
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

function GridStory({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            background: tema.card,
            borderRadius: 16,
            border: `1px solid ${tema.border}`,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 160,
              minHeight: 160,
              background: tema.bg,
              flexShrink: 0,
            }}
          >
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="160px"
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
              padding: "20px 24px",
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
                  fontSize: 17,
                  fontWeight: 700,
                  color: tema.text,
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {p.nombre}
              </p>
              {p.descripcion && (
                <p style={{ fontSize: 13, color: tema.muted, lineHeight: 1.6 }}>
                  {p.descripcion}
                </p>
              )}
            </div>
            <div>
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
        </div>
      ))}
    </div>
  );
}

function GridBold({
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
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
            minHeight: 280,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: tema.bg }}>
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="25vw"
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
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to top, ${tema.dark}ee 0%, ${tema.dark}66 50%, transparent 100%)`,
            }}
          />
          <div
            style={{ position: "relative", padding: "16px 14px", zIndex: 1 }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              {p.nombre}
            </p>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                $
                {Number(
                  p.precio_descuento && p.precio_descuento < p.precio
                    ? p.precio_descuento
                    : p.precio,
                ).toLocaleString("es-AR")}
              </span>
            </div>
            <VarianteSelector
              producto={p}
              isPro={isPro}
              accentColor="#fff"
              borderColor="rgba(255,255,255,0.4)"
              onAgregar={(v) => onAgregar(p, v)}
              onConsultar={() => onConsultar(p)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridMinimalista({
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 0",
            borderBottom:
              i < productos.length - 1 ? `1px solid ${tema.border}` : "none",
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: tema.text,
                marginBottom: 3,
              }}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p style={{ fontSize: 12, color: tema.muted }}>{p.descripcion}</p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexShrink: 0,
            }}
          >
            <PrecioProducto p={p} tema={tema} size={16} />
            <div style={{ width: 130 }}>
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

function GridCatalogo({
  productos,
  isPro,
  tema,
  onAgregar,
  onConsultar,
}: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {productos.map((p) => (
        <div
          key={p.id}
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 0,
            background: tema.card,
            borderRadius: 16,
            border: `1px solid ${tema.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{ position: "relative", height: 220, background: tema.bg }}
          >
            {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                style={{ objectFit: "cover" }}
                sizes="220px"
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
                }}
              >
                🛍️
              </div>
            )}
          </div>
          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: tema.text,
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {p.nombre}
              </p>
              {p.descripcion && (
                <p
                  style={{
                    fontSize: 14,
                    color: tema.muted,
                    lineHeight: 1.7,
                    marginBottom: 12,
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
                    flexWrap: "wrap",
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
                        background: tema.accent + "15",
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
                    color: p.stock <= 5 ? "#C9A84C" : tema.muted,
                    marginBottom: 8,
                  }}
                >
                  {p.stock === 0
                    ? "❌ Sin stock"
                    : p.stock <= 5
                      ? `⚠️ Últimas ${p.stock} unidades`
                      : "✓ Stock disponible"}
                </p>
              )}
            </div>
            <div>
              <div style={{ marginBottom: 14 }}>
                <PrecioProducto p={p} tema={tema} size={22} />
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PublicProfile({ emp, productos, plantilla }: Props) {
  const config = parsePlantilla(plantilla ?? emp.plantilla);
  const tema = getTema(config);
  const [activeImg, setActiveImg] = useState(0);
  const images = emp.images?.filter(Boolean) ?? [];
  const { addItem } = useCart();
  const isPro = emp.plan === "premium";
  const productosActivos = productos.filter((p) => p.activo !== false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("visitas")
      .insert({
        emprendimiento_id: Number(emp.id),
        source: "direct",
        type: "pageview",
      })
      .then(() => {});
  }, [emp.id]);

  async function trackClick(
    type: "whatsapp" | "instagram" | "web",
    url: string,
  ) {
    const supabase = createClient();
    await supabase.from("visitas").insert({
      emprendimiento_id: Number(emp.id),
      source: type,
      type: "click",
    });
    window.open(url, "_blank");
  }

  function handleAgregar(
    producto: Producto,
    variante?: { tipo: string; opcion: string },
  ) {
    const precio =
      producto.precio_descuento && producto.precio_descuento < producto.precio
        ? producto.precio_descuento
        : producto.precio;
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio,
      imagen: producto.imagen,
      variante,
    });
  }

  function handleConsultar(producto: Producto) {
    trackClick(
      "whatsapp",
      buildWA(
        emp.whatsapp,
        `Hola! Me interesa "${producto.nombre}" que vi en Viko.`,
      ),
    );
  }

  const gridProps: GridProps = {
    productos: productosActivos,
    isPro,
    tema,
    onAgregar: handleAgregar,
    onConsultar: handleConsultar,
  };

  const gridPorLayout: Record<string, React.ReactNode> = {
    clasica: <GridClasica {...gridProps} />,
    tienda: <GridTienda {...gridProps} />,
    story: <GridStory {...gridProps} />,
    bold: <GridBold {...gridProps} />,
    minimalista: <GridMinimalista {...gridProps} />,
    catalogo: <GridCatalogo {...gridProps} />,
    revista: <GridRevista {...gridProps} />,
    portfolio: <GridPortfolio {...gridProps} />,
    premium: <GridPremium {...gridProps} />,
    mercado: <GridMercado {...gridProps} />,
  };

  return (
    <div
      className={styles.profilePage}
      style={{ background: tema.bg, color: tema.text }}
    >
      {/* NAV */}
      <nav
        className={styles.nav}
        style={{ background: `${tema.bg}f0`, borderBottomColor: tema.border }}
      >
        <Link
          href="/directorio"
          className={styles.navLogo}
          style={{ color: tema.text }}
        >
          Viko<span style={{ color: tema.accent }}>.</span>
        </Link>
        <div className={styles.navRight}>
          <Link
            href="/directorio"
            className={styles.navLink}
            style={{ color: tema.muted }}
          >
            ← Directorio
          </Link>
          <Link href="/register" className={styles.navCta}>
            Publicar mi emprendimiento
          </Link>
        </div>
      </nav>

      {/* HERO — ancho limitado */}
      <div className={styles.profileWrap}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* Galería */}
          <div className={styles.gallery}>
            {images.length > 0 ? (
              <>
                <div className={styles.mainImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[activeImg]}
                    alt={emp.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {emp.plan === "premium" && (
                    <span className={styles.planBadge}>Premium</span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className={styles.thumbs}>
                    {images.map((src, i) => (
                      <button
                        key={i}
                        className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                        onClick={() => setActiveImg(i)}
                        style={{
                          borderColor:
                            i === activeImg ? tema.accent : "transparent",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noImage}>
                <span>📷</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <div className={styles.rubro} style={{ color: tema.accent }}>
              {emp.rubro}
            </div>
            <h1 className={styles.nombre} style={{ color: tema.text }}>
              {emp.nombre}
            </h1>
            <p className={styles.tagline} style={{ color: tema.muted }}>
              {emp.tagline}
            </p>
            {emp.ubicacion && (
              <div
                className={styles.meta}
                style={{
                  borderTopColor: tema.border,
                  borderBottomColor: tema.border,
                  color: tema.muted,
                }}
              >
                <span>📍 {emp.ubicacion}</span>
                <span>
                  {emp.envios ? "🚚 Envíos a todo el país" : "🏪 Solo local"}
                </span>
              </div>
            )}
            {emp.descripcion && (
              <p className={styles.desc} style={{ color: tema.text }}>
                {emp.descripcion}
              </p>
            )}
            <div className={styles.contactBtns}>
              {emp.whatsapp && (
                <button
                  className={`${styles.contactBtn} ${styles.btnWa}`}
                  onClick={() =>
                    trackClick(
                      "whatsapp",
                      buildWA(
                        emp.whatsapp,
                        `Hola ${emp.nombre}! Vi tu perfil en Viko.`,
                      ),
                    )
                  }
                >
                  💬 Contactar por WhatsApp
                </button>
              )}
              {emp.instagram && (
                <button
                  className={`${styles.contactBtn} ${styles.btnIg}`}
                  onClick={() =>
                    trackClick(
                      "instagram",
                      `https://instagram.com/${emp.instagram}`,
                    )
                  }
                >
                  📷 Ver en Instagram
                </button>
              )}
              {emp.web && (
                <button
                  className={`${styles.contactBtn} ${styles.btnWeb}`}
                  onClick={() => trackClick("web", emp.web!)}
                >
                  🌐 Sitio web
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTOS — full width */}
      {productosActivos.length > 0 && (
        <div className={styles.productosWrap}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h3 className={styles.productosTitle} style={{ color: tema.text }}>
              {isPro ? "🛍️ Tienda" : "Productos y servicios"}
            </h3>
            {isPro && (
              <span
                style={{
                  fontSize: 11,
                  color: tema.accent,
                  background: tema.accent + "15",
                  padding: "4px 12px",
                  borderRadius: 100,
                  fontWeight: 600,
                }}
              >
                Pago online
              </span>
            )}
          </div>
          {gridPorLayout[config.layout] ?? <GridClasica {...gridProps} />}
        </div>
      )}

      {/* BADGE */}
      <div style={{ padding: "0 5vw 48px" }}>
        <div
          className={styles.vikoBadge}
          style={{ background: tema.card, borderColor: tema.border }}
        >
          <span className={styles.vikoBadgeText} style={{ color: tema.muted }}>
            ✦ Emprendimiento verificado en
          </span>
          <Link
            href="/directorio"
            className={styles.vikoBadgeLogo}
            style={{ color: tema.accent }}
          >
            Viko.
          </Link>
        </div>
      </div>
    </div>
  );
}
