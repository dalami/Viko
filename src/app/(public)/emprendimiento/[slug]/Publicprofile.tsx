"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./public.module.css";
import { createClient } from "../../../../lib/supabase";
import { useCart } from "../../../../context/CartContext";
import { parsePlantilla, getTema } from "../../../../lib/plantillas";
import type { Producto, EmpPublic } from "../../../../lib/types";
import {
  GridTienda,
  GridStory,
  GridBold,
  GridCatalogo,
  GridRevista,
  GridPortfolio,
  GridMercado,
  GridBento,
  GridLookbook,
  GridHero,
  GridMosaico,
  GridLineal,
  type GridProps,
} from "./Gridlayouts";
import LayoutClasica from "./LayoutClasica";
import LayoutPremium from "./Layoutpremium";
import LayoutMinimalista from "./Layoutminimalista";
import type { LayoutProps } from "./Layouttypes";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  emp: EmpPublic;
  productos: Producto[];
  plantilla?: unknown;
}

function buildWA(whatsapp: string, texto: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(texto)}`;
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

    // Notificar al dueño solo en WhatsApp
    if (type === "whatsapp" && emp.email) {
      fetch("/api/notificacion-contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empNombre: emp.nombre,
          empEmail: emp.email,
          tipo: type,
        }),
      });
    }

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

  // Props compartidos para layouts propios
  const layoutProps: LayoutProps = {
    emp,
    tema,
    images,
    activeImg,
    setActiveImg,
    productosActivos,
    isPro,
    gridProps,
    onContactWA: () =>
      trackClick(
        "whatsapp",
        buildWA(emp.whatsapp, `Hola ${emp.nombre}! Vi tu perfil en Viko.`),
      ),
    onContactIG: () =>
      trackClick("instagram", `https://instagram.com/${emp.instagram}`),
    onContactWeb: () => emp.web && trackClick("web", emp.web),
  };

  // ── Layouts con componente propio ──
  if (config.layout === "clasica") return <LayoutClasica {...layoutProps} />;
  if (config.layout === "premium") return <LayoutPremium {...layoutProps} />;
  if (config.layout === "minimalista")
    return <LayoutMinimalista {...layoutProps} />;

  // ── Resto: nav/hero genérico + grid específico ──
  const gridPorLayout: Record<string, React.ReactNode> = {
    tienda: <GridTienda {...gridProps} />,
    story: <GridStory {...gridProps} />,
    bold: <GridBold {...gridProps} />,
    catalogo: <GridCatalogo {...gridProps} />,
    revista: <GridRevista {...gridProps} />,
    portfolio: <GridPortfolio {...gridProps} />,
    mercado: <GridMercado {...gridProps} />,
    bento: <GridBento {...gridProps} />,
    lookbook: <GridLookbook {...gridProps} />,
    hero: <GridHero {...gridProps} />,
    mosaico: <GridMosaico {...gridProps} />,
    lineal: <GridLineal {...gridProps} />,
  };

  return (
    <div
      className={styles.profilePage}
      style={{ background: tema.bg, color: tema.text }}
    >
      {/* NAV genérico */}
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
        </div>
      </nav>

      {/* HERO genérico */}
      <div className={styles.profileWrap}>
        <div className={styles.heroGrid}>
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
                    <span className={styles.planBadge}>Pro</span>
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

      {/* PRODUCTOS */}
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
          {gridPorLayout[config.layout] ?? <GridTienda {...gridProps} />}
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
