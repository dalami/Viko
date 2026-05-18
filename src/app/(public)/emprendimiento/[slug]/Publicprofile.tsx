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
  precio_descuento?: number;
  stock?: number;
  tags?: string[];
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
                letterSpacing: "0.08em",
              }}
            >
              {v.tipo}
            </p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {v.opciones.map((op) => (
                <button
                  key={op}
                  onClick={() =>
                    setSelecciones((prev) => ({ ...prev, [v.tipo]: op }))
                  }
                  style={{
                    padding: "4px 10px",
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
              fontSize: 12,
              padding: "7px 12px",
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
            style={{
              flex: 1,
              borderColor: accentColor,
              color: accentColor,
              fontSize: 12,
              padding: "7px 12px",
            }}
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
      precio:
        producto.precio_descuento && producto.precio_descuento < producto.precio
          ? producto.precio_descuento
          : producto.precio,
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

              {/* Grid de productos — igual que dashboard */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 12,
                }}
              >
                {productosActivos.map((p) => {
                  const precioFinal =
                    p.precio_descuento && p.precio_descuento < p.precio
                      ? p.precio_descuento
                      : p.precio;
                  const tieneDescuento =
                    p.precio_descuento && p.precio_descuento < p.precio;
                  const descPct = tieneDescuento
                    ? Math.round((1 - p.precio_descuento! / p.precio) * 100)
                    : 0;

                  return (
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
                      {/* Imagen */}
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
                            sizes="150px"
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
                        {/* Badges */}
                        {tieneDescuento && (
                          <div
                            style={{ position: "absolute", top: 6, left: 6 }}
                          >
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
                              -{descPct}% OFF
                            </span>
                          </div>
                        )}
                        {p.stock !== undefined &&
                          p.stock !== null &&
                          p.stock <= 5 &&
                          p.stock > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: tieneDescuento ? 24 : 6,
                                left: 6,
                              }}
                            >
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
                            </div>
                          )}
                      </div>

                      {/* Info */}
                      <div
                        style={{
                          padding: "10px 12px",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
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
                              lineHeight: 1.3,
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {p.descripcion}
                          </p>
                        )}
                        {/* Precio */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: tieneDescuento ? "#C4664A" : tema.accent,
                            }}
                          >
                            ${Number(precioFinal).toLocaleString("es-AR")}
                          </span>
                          {tieneDescuento && (
                            <span
                              style={{
                                fontSize: 11,
                                color: tema.muted,
                                textDecoration: "line-through",
                              }}
                            >
                              ${Number(p.precio).toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>
                        {/* Tags */}
                        {p.tags && p.tags.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              flexWrap: "wrap",
                            }}
                          >
                            {p.tags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontSize: 9,
                                  padding: "1px 6px",
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

                      {/* Botón */}
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
                          onAgregar={(variante) => handleAgregar(p, variante)}
                          onConsultar={() => handleConsultar(p)}
                        />
                      </div>
                    </div>
                  );
                })}
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
