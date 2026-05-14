"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./public.module.css";
import { createClient } from "../../../../lib/supabase";
import { useCart } from "../../../../context/CartContext";
import Image from "next/image";

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
}

interface Props {
  emp: Emp;
  productos: Producto[];
}

function buildWA(whatsapp: string, texto: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(texto)}`;
}

// Selector de variantes inline
function VarianteSelector({
  producto,
  onAgregar,
  onConsultar,
  isPro,
}: {
  producto: Producto;
  onAgregar: (variante?: { tipo: string; opcion: string }) => void;
  onConsultar: () => void;
  isPro: boolean;
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
                color: "#8A8680",
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
                    border: `1.5px solid ${selecciones[v.tipo] === op ? "#1A1814" : "#E8E4DC"}`,
                    background:
                      selecciones[v.tipo] === op ? "#1A1814" : "transparent",
                    color: selecciones[v.tipo] === op ? "#FAFAF7" : "#1A1814",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
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
            style={{ flex: 1 }}
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
              border: "1.5px solid #E8E4DC",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              color: "#8A8680",
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default function PublicProfile({ emp, productos }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const images = emp.images?.filter(Boolean) ?? [];
  console.log("images:", images, typeof emp.images);
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
      .then(({ error }) => console.log("insert result:", error));
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
    <div className={styles.profilePage}>
      <nav className={styles.nav}>
        <Link href="/directorio" className={styles.navLogo}>
          Viko<span className={styles.navDot}>.</span>
        </Link>
        <div className={styles.navRight}>
          <Link href="/directorio" className={styles.navLink}>
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
          <div className={styles.rubro}>{emp.rubro}</div>
          <h1 className={styles.nombre}>{emp.nombre}</h1>
          <p className={styles.tagline}>{emp.tagline}</p>

          {emp.ubicacion && (
            <div className={styles.meta}>
              <span>📍 {emp.ubicacion}</span>
              <span>
                {emp.envios ? "🚚 Envíos a todo el país" : "🏪 Solo local"}
              </span>
            </div>
          )}

          {emp.descripcion && <p className={styles.desc}>{emp.descripcion}</p>}

          {/* Contacto — todos los planes */}
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
                <h3 className={styles.productosTitle}>
                  {isPro ? "🛍️ Tienda" : "Productos y servicios"}
                </h3>
                {isPro && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#8A8680",
                      background: "#F5F2EC",
                      padding: "3px 10px",
                      borderRadius: 100,
                    }}
                  >
                    Pago online disponible
                  </span>
                )}
              </div>
              <div className={styles.productosGrid}>
                {productosActivos.map((p) => (
                  <div key={p.id} className={styles.productoCard}>
                    {/* Imagen del producto */}
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
                      <span className={styles.productoNombre}>{p.nombre}</span>
                      {p.descripcion && (
                        <span className={styles.productoDesc}>
                          {p.descripcion}
                        </span>
                      )}
                    </div>
                    <div className={styles.productoBottom}>
                      <span className={styles.productoPrecio}>
                        ${Number(p.precio).toLocaleString("es-AR")}
                      </span>
                    </div>
                    <VarianteSelector
                      producto={p}
                      isPro={isPro}
                      onAgregar={(variante) => handleAgregar(p, variante)}
                      onConsultar={() => handleConsultar(p)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.vikoBadge}>
            <span className={styles.vikoBadgeText}>
              ✦ Emprendimiento verificado en
            </span>
            <Link href="/directorio" className={styles.vikoBadgeLogo}>
              Viko.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
