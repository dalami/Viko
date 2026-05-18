"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../directorio/directorio.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Emp {
  id: number;
  nombre: string;
  rubro: string;
  tagline: string;
  ubicacion?: string;
  envios?: boolean;
  whatsapp?: string;
  instagram?: string;
  web?: string;
  images?: string[];
  plan?: string;
  destacadoSemana?: boolean;
  descripcion?: string;
  slug?: string;
  productos_nombres?: string[];
}

const CATEGORIAS = [
  { label: "✦ Todos", value: "all" },
  { label: "🍽️ Gastronomía", value: "Gastronomía" },
  { label: "🪴 Deco", value: "Deco" },
  { label: "🎁 Regalos", value: "Regalos" },
  { label: "👗 Moda", value: "Moda" },
  { label: "⚡ Servicios", value: "Servicios" },
  { label: "✨ Belleza", value: "Belleza" },
  { label: "🎉 Eventos", value: "Eventos" },
  { label: "💻 Digital", value: "Digital" },
  { label: "🧖 Masajes", value: "Masajes" },
  { label: "🖨️ Sublimados", value: "Sublimados" },
  { label: "💍 Accesorios", value: "Accesorios" },
  { label: "🕯️ Velas", value: "Velas" },
  { label: "🫙 Suplementos", value: "Suplementos" },
  { label: "🛍️ Bolsas", value: "Bolsas" },
  { label: "🌸 Aromas", value: "Aromas" },
  { label: "🧶 Macrame", value: "Macrame" },
];

function slugify(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // ← esto falta
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildWA(whatsapp: string, nombre: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(`Hola ${nombre}! Vi tu ficha en Viko.`)}`;
}

export default function DirectorioClient({
  emprendimientos,
  isLoggedIn,
}: {
  emprendimientos: Emp[];
  isLoggedIn: boolean;
}) {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [zona, setZona] = useState("all");
  const router = useRouter();

  const zonas = [
    "all",
    ...Array.from(
      new Set(emprendimientos.map((e) => e.ubicacion).filter(Boolean)),
    ),
  ] as string[];

  const filtered = emprendimientos.filter((e) => {
    const matchCat = cat === "all" || e.rubro === cat;
    const matchZona = zona === "all" || e.ubicacion === zona;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.nombre.toLowerCase().includes(q) ||
      e.rubro.toLowerCase().includes(q) ||
      (e.ubicacion?.toLowerCase().includes(q) ?? false) ||
      e.tagline.toLowerCase().includes(q) ||
      (e.productos_nombres?.some((p) => p.toLowerCase().includes(q)) ?? false);
    return matchCat && matchZona && matchSearch;
  });

  async function handleUpgrade(periodo: "mensual" | "anual" = "mensual") {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodo }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  function getBadges(e: Emp) {
    const badges = [];
    if (e.plan === "premium")
      badges.push({ label: "⭐ Pro", color: "#C9A84C" });
    if (
      e.nombre &&
      e.rubro &&
      e.tagline &&
      e.descripcion &&
      e.images &&
      e.images.filter(Boolean).length > 0
    )
      badges.push({ label: "✅ Verificado", color: "#6B7A5A" });
    if (!e.images || e.images.filter(Boolean).length === 0)
      badges.push({ label: "🏪 Activo", color: "#7A756A" });
    return badges;
  }
  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          Viko<span className={styles.navDot}>.</span>
        </Link>

        <div className={styles.navCenter}>
          <a href="#grid" className={styles.navLink}>
            Emprendimientos
          </a>
          <Link href="/login" className={styles.navLink}>
            Acceso emprendedores
          </Link>
          <Link href="/feed" className={styles.navLink}>
            Comunidad
          </Link>
          <Link href="/register" className={styles.navLinkPublicar}>
            Publicar
          </Link>
        </div>
        <div className={styles.navRight}>
          <Link href="/login" className={styles.navAcceder}>
            Acceder
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Directorio de emprendimientos</div>
        <h1 className={styles.heroTitle}>
          Publicá tu emprendimiento
          <br />
          <em>gratis</em> y llegá a más clientes
        </h1>
        <p className={styles.heroSub}>
          Sin comisiones. Sin tarjeta de crédito. Tu ficha lista en minutos.
        </p>

        <div className={styles.heroCtaRow}>
          <input
            className={styles.heroInput}
            type="email"
            placeholder="tu@email.com"
          />
          <Link
            href="/register"
            className={styles.heroBtn}
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            Empezar gratis →
          </Link>
        </div>

        <div className={styles.heroTrust}>
          <span>Publicación gratuita</span>
          <span>Sin comisiones por venta</span>
          <span>Configuración en 5 minutos</span>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{emprendimientos.length}</span>
            <span className={styles.statLabel}>Emprendimientos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>
              {new Set(emprendimientos.map((e) => e.rubro)).size}
            </span>
            <span className={styles.statLabel}>Categorías</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>AR</span>
            <span className={styles.statLabel}>Independiente</span>
          </div>
        </div>
      </section>

      {/* BUSCADOR */}
      <div className={styles.searchWrap}>
        <div className={styles.searchBar}>
          <span>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscá por nombre, rubro, ciudad o producto..."
            value={search}
            autoComplete="off"
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: "var(--muted)",
                padding: "0 4px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div className={styles.catsWrap}>
        <div className={styles.cats}>
          {CATEGORIAS.map((c) => (
            <button
              key={c.value}
              className={`${styles.pill} ${cat === c.value ? styles.pillActive : ""}`}
              onClick={() => setCat(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ZONAS */}
      <div className={styles.catsWrap}>
        <div className={styles.cats}>
          {zonas.map((z) => (
            <button
              key={z}
              className={`${styles.pill} ${zona === z ? styles.pillActive : ""}`}
              onClick={() => setZona(z)}
            >
              {z === "all" ? "📍 Todas las zonas" : `📍 ${z}`}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className={styles.gridWrap} id="grid">
        <div className={styles.gridHeader}>
          <span className={styles.gridCount}>
            {filtered.length} emprendimiento{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>Sin resultados. Probá con otro término o categoría.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((e) => {
              const img = e.images?.[0];
              const badges = getBadges(e);
              return (
                <div
                  key={e.id}
                  className={styles.card}
                  onClick={() =>
                    router.push(`/emprendimiento/${slugify(e.nombre)}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.cardImg}>
                    {img ? (
                      <Image
                        src={img}
                        alt={e.nombre}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 700px) 100vw, 33vw"
                      />
                    ) : (
                      <div className={styles.cardImgEmpty}>📷</div>
                    )}
                    <div className={styles.cardBadges}>
                      <span className={styles.badgeCat}>{e.rubro}</span>
                      {e.plan === "featured" && (
                        <span className={styles.badgeFeatured}>Destacado</span>
                      )}
                      {e.plan === "premium" && (
                        <span className={styles.badgePremium}>Premium</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.cardName}>{e.nombre}</p>
                    <p className={styles.cardTag}>{e.tagline}</p>

                    {badges.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}
                      >
                        {badges.map((b) => (
                          <span
                            key={b.label}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 100,
                              background: b.color + "20",
                              color: b.color,
                              border: `1px solid ${b.color}40`,
                            }}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.cardMeta}>
                      {e.ubicacion && <span>📍 {e.ubicacion}</span>}
                      <span>{e.envios ? "🚚 Envíos" : "🏪 Local"}</span>
                    </div>

                    <div
                      className={styles.cardFooter}
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      {e.whatsapp && (
                        <a
                          href={buildWA(e.whatsapp, e.nombre)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cardBtn}
                        >
                          💬
                        </a>
                      )}
                      {e.instagram && (
                        <a
                          href={`https://instagram.com/${e.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cardBtn}
                        >
                          📷
                        </a>
                      )}
                      {e.web && (
                        <a
                          href={e.web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cardBtn}
                        >
                          🌐
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PLANES */}
      <section className={styles.planes}>
        <div className={styles.planesInner}>
          <p className={styles.planesLabel}>Modelo de negocio</p>
          <h2 className={styles.planesTitle}>
            Impulsá tu emprendimiento con
            <br />
            <em>más visibilidad</em>
          </h2>

          <div className={styles.planesGrid}>
            {/* FREE */}
            <div className={styles.planCard}>
              <div className={styles.planCardLabel}>FREE</div>
              <div className={styles.planCardPrice}>
                $0<span>/mes</span>
              </div>
              <ul className={styles.planCardFeatures}>
                <li>✓ 3 fotos</li>
                <li>✓ WhatsApp, Instagram y redes</li>
                <li>✓ Perfil público en el directorio</li>
                <li>✓ Hasta 3 productos</li>
                <li className={styles.featureOff}>✕ Carrito + MercadoPago</li>
                <li className={styles.featureOff}>✕ Métricas completas</li>
                <li className={styles.featureOff}>✕ Landing page + QR</li>
              </ul>
              <Link
                href={isLoggedIn ? "/dashboard?view=planes" : "/register"}
                className={styles.planCtaSecondary}
              >
                {isLoggedIn ? "Ver mi plan →" : "Empezar gratis →"}
              </Link>
            </div>

            {/* PRO */}
            <div className={`${styles.planCard} ${styles.planCardPro}`}>
              <div className={styles.planCardReco}>⭐ Recomendado</div>
              <div className={styles.planCardLabel}>VIKO PRO</div>
              <div className={styles.planCardPrice}>
                $9.900<span>/mes</span>
              </div>
              <p className={styles.planCardAnual}>
                o $5.940/mes abonando anual — 40% off
              </p>
              <ul className={styles.planCardFeatures}>
                <li>✓ Todo lo del plan Free</li>
                <li>✓ 5 fotos</li>
                <li>✓ Productos ilimitados</li>
                <li>✓ Carrito + pago con MercadoPago</li>
                <li>✓ Métricas completas</li>
                <li>✓ Landing page + QR propio</li>
              </ul>

              {isLoggedIn ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <button
                    type="button"
                    onClick={() => handleUpgrade("mensual")}
                    className={styles.planCta}
                  >
                    ⚡ Activar mensual — $9.900/mes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpgrade("anual")}
                    className={styles.planCtaSecondary}
                    style={{ color: "#C9A84C", borderColor: "#C9A84C" }}
                  >
                    🌟 Activar anual — $5.940/mes
                  </button>
                </div>
              ) : (
                <Link href="/register" className={styles.planCta}>
                  Quiero formar parte →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLogo}>
          Viko.
        </Link>
        <Link
          href="/admin"
          style={{
            fontSize: 10,
            color: "rgba(26,24,20,0.2)",
            textDecoration: "none",
          }}
        >
          {" "}
          Admin
        </Link>
        <span className={styles.footerCopy}>
          © 2026 Viko — Directorio de emprendimientos seleccionados.
        </span>
      </footer>
    </div>
  );
}
