"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./public.module.css";
import { createClient } from "../../../../lib/supabase";
import { useCart } from "../../../../context/CartContext";
import Image from "next/image";
import { parsePlantilla, getTema } from "../../../../lib/plantillas";

interface Variante {
  tipo: string;
  opciones: string[];
}

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen?: string;
  variantes?: Variante[];
  activo?: boolean;
}

interface Emp {
  id: number;
  nombre: string;
  tagline?: string;
  rubro?: string;
  ubicacion?: string;
  envios?: boolean;
  desc?: string;
  descripcion?: string;
  whatsapp: string;
  instagram?: string;
  web?: string;
  images?: string[];
  plan?: string;
  mp_connected?: boolean;
  plantilla?: unknown;
}

interface Props {
  emp: Emp;
  productos: Producto[];
  plantilla?: unknown;  
}

function buildWA(whatsapp: string, texto: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(texto)}`;
}

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

function VarianteSelector({
  producto,
  onAgregar,
  onConsultar,
  isPro,
  accentColor,
  borderColor,
}: {
  producto: Producto;
  onAgregar: (variante?: { tipo: string; opcion: string }) => void;
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {open &&
        variantes.map((v) => (
          <div key={v.tipo}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: accentColor,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {v.tipo}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {v.opciones.map((op) => (
                <button
                  key={op}
                  onClick={() =>
                    setSelecciones((prev) => ({ ...prev, [v.tipo]: op }))
                  }
                  style={{
                    padding: "5px 12px",
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
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

      <div style={{ display: "flex", gap: 8 }}>
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
                ? "✓ Agregar al carrito"
                : "Elegí una opción"
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
              padding: "8px 12px",
              borderRadius: 10,
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

export default function PublicProfile({
  emp,
  productos,
  plantilla,
}: Props) {
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
      .then(({ error }) => console.log("visit:", error));
  }, [emp.id]);

  async function trackClick(
    type: "whatsapp" | "instagram" | "web",
    url: string,
  ) {
    const supabase = createClient();
    await supabase
      .from("visitas")
      .insert({
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
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
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

      <div className={styles.profileWrap}>
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
                {emp.plan === "featured" && (
                  <span
                    className={`${styles.planBadge} ${styles.planFeatured}`}
                  >
                    Destacado
                  </span>
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

          {/* Contacto */}
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

          {/* Productos */}
          {productosActivos.length > 0 && (
            <div className={styles.productos}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h3
                  className={styles.productosTitle}
                  style={{ color: tema.text }}
                >
                  {isPro ? "🛍️ Tienda" : "Productos y servicios"}
                </h3>
                {isPro && (
                  <span
                    style={{
                      fontSize: 11,
                      color: tema.accent,
                      background: tema.accent + "15",
                      padding: "3px 10px",
                      borderRadius: 100,
                      fontWeight: 600,
                    }}
                  >
                    Pago online
                  </span>
                )}
              </div>

              <div className={styles.productosGrid}>
                {productosActivos.map((p) => (
                  <div
                    key={p.id}
                    className={styles.productoCard}
                    style={{ background: tema.card, borderColor: tema.border }}
                  >
                    {p.imagen && (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "1",
                          borderRadius: 10,
                          overflow: "hidden",
                          marginBottom: 10,
                        }}
                      >
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="200px"
                        />
                      </div>
                    )}
                    <div className={styles.productoInfo}>
                      <span
                        className={styles.productoNombre}
                        style={{ color: tema.text }}
                      >
                        {p.nombre}
                      </span>
                      {p.descripcion && (
                        <span
                          className={styles.productoDesc}
                          style={{ color: tema.muted }}
                        >
                          {p.descripcion}
                        </span>
                      )}
                    </div>
                    <div className={styles.productoBottom}>
                      <span
                        className={styles.productoPrecio}
                        style={{ color: tema.accent }}
                      >
                        ${Number(p.precio).toLocaleString("es-AR")}
                      </span>
                    </div>
                    <VarianteSelector
                      producto={p}
                      isPro={isPro}
                      accentColor={tema.accent}
                      borderColor={tema.border}
                      onAgregar={(variante) => handleAgregar(p, variante)}
                      onConsultar={() => handleConsultar(p)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={styles.vikoBadge}
            style={{ background: tema.card, borderColor: tema.border }}
          >
            <span
              className={styles.vikoBadgeText}
              style={{ color: tema.muted }}
            >
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
    </div>
  );
}
