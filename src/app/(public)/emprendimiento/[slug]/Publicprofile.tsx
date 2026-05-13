"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./public.module.css";
import { createClient } from "../../../../lib/supabase";
import Image from "next/image";

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
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
}

interface Props {
  emp: Emp;
  productos: Producto[];
}

function buildWA(whatsapp: string, texto: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(texto)}`;
}

export default function PublicProfile({ emp, productos }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const images = emp.images?.filter(Boolean) ?? [];

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
    await supabase.from("visitas").insert({
      emprendimiento_id: Number(emp.id),
      source: type,
      type: "click",
    });
    window.open(url, "_blank");
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
        <div className={styles.gallery}>
          {images.length > 0 ? (
            <>
              <div className={styles.mainImage}>
                <Image
                  src={images[activeImg]}
                  alt={emp.nombre}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
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
                      <Image
                        src={src}
                        alt=""
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="64px"
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

          {emp.plan === "premium" && (
            <div className={styles.contactBtns}>
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
          )}

          {productos.length > 0 && (
            <div className={styles.productos}>
              <h3 className={styles.productosTitle}>Productos y servicios</h3>
              <div className={styles.productosGrid}>
                {productos.map((p) => (
                  <div key={p.id} className={styles.productoCard}>
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
                      <button
                        className={styles.productoWa}
                        onClick={() =>
                          trackClick(
                            "whatsapp",
                            buildWA(
                              emp.whatsapp,
                              `Hola! Me interesa "${p.nombre}" que vi en Viko.`,
                            ),
                          )
                        }
                      >
                        Consultar →
                      </button>
                    </div>
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
