"use client";

import Link from "next/link";
import styles from "../directorio/directorio.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { slugify } from "../../../lib/utils";
import { useState, useEffect } from "react";
import NavPublico from "../directorio/NavPublico";

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
  rubros?: string[];
}

const FAQS = [
  {
    grupo: "Sobre publicar",
    items: [
      {
        q: "¿Es gratis publicar mi emprendimiento?",
        a: "Sí, el plan Free es gratis para siempre. Sin tarjeta de crédito ni costos ocultos.",
      },
      {
        q: "¿Cuánto tarda en estar visible mi ficha?",
        a: "En minutos. Apenas completás el registro tu perfil ya aparece en el directorio.",
      },
      {
        q: "¿Necesito saber de tecnología?",
        a: "No. La configuración es simple y guiada, sin conocimientos técnicos necesarios.",
      },
    ],
  },
  {
    grupo: "Sobre los planes",
    items: [
      {
        q: "¿Qué diferencia hay entre Free y Pro?",
        a: "Free incluye hasta 3 productos y perfil básico. Pro agrega carrito de compras, pagos con MercadoPago, métricas detalladas, landing page y QR propio.",
      },
      {
        q: "¿Puedo cancelar el plan Pro cuando quiera?",
        a: "Sí, sin permanencia ni penalidad. Cancelás cuando quieras desde tu panel.",
      },
      {
        q: "¿Hay descuento pagando anual?",
        a: "Sí, 40% off pagando el año completo. En lugar de $9.900/mes pagás $5.940/mes.",
      },
    ],
  },
  {
    grupo: "Sobre ventas",
    items: [
      {
        q: "¿Viko cobra comisión por mis ventas?",
        a: "No. Cero comisiones. Lo que vendés es completamente tuyo.",
      },
      {
        q: "¿Cómo recibo los pagos?",
        a: "Directo en tu cuenta de MercadoPago, sin intermediarios. El dinero va a tu cuenta al instante.",
      },
      {
        q: "¿Puedo vender sin MercadoPago?",
        a: "Sí, podés recibir pagos por transferencia bancaria o efectivo. El cliente elige cómo pagar.",
      },
    ],
  },
];

function buildWA(whatsapp: string, nombre: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(`Hola ${nombre}! Vi tu ficha en Viko.`)}`;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "18px 0",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--black)",
            lineHeight: 1.4,
          }}
        >
          {q}
        </p>
        <span
          style={{
            fontSize: 18,
            color: "var(--muted)",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(45deg)" : "none",
          }}
        >
          +
        </span>
      </div>
      {open && (
        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            marginTop: 10,
            lineHeight: 1.7,
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  plan,
}: {
  icon: string;
  title: string;
  desc: string;
  plan: string | null;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--black)" : "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "28px 24px",
        transition:
          "background 0.22s ease, transform 0.18s ease, box-shadow 0.18s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.12)" : "none",
        cursor: "default",
        position: "relative",
      }}
    >
      {plan && (
        <span
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: hovered ? "#C9A84C" : "#C9A84C",
            background: hovered
              ? "rgba(201,168,76,0.15)"
              : "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.3)",
            padding: "3px 8px",
            borderRadius: 100,
          }}
        >
          {plan}
        </span>
      )}
      <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
      <p
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: hovered ? "#F5F0E8" : "var(--black)",
          marginBottom: 8,
          lineHeight: 1.3,
          transition: "color 0.22s ease",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.65,
          color: hovered ? "rgba(245,240,232,0.65)" : "var(--muted)",
          margin: 0,
          transition: "color 0.22s ease",
        }}
      >
        {desc}
      </p>
    </div>
  );
}

export default function DirectorioClient({
  emprendimientos,
  isLoggedIn,
  miEmpId,
}: {
  emprendimientos: Emp[];
  isLoggedIn: boolean;
  miEmpId: number | null;
}) {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [zona, setZona] = useState("all");
  const router = useRouter();
  const [banner, setBanner] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBanner(false), 15000);
    return () => clearTimeout(t);
  }, []);

  // Categorías dinámicas — combina rubro y rubros[] de cada emprendimiento
  const categoriasExtra = Array.from(
    new Set(
      emprendimientos
        .flatMap((e) => [e.rubro, ...(e.rubros ?? [])])
        .filter(Boolean),
    ),
  ).sort() as string[];

  const CATEGORIAS_DINAMICAS = [
    { label: "✦ Todos", value: "all" },
    ...categoriasExtra.map((c) => ({ label: c, value: c })),
  ];

  const zonas = [
    "all",
    ...Array.from(
      new Set(emprendimientos.map((e) => e.ubicacion).filter(Boolean)),
    ),
  ] as string[];

  const filtered = emprendimientos.filter((e) => {
    const empRubros = [e.rubro, ...(e.rubros ?? [])].filter(Boolean);
    const matchCat = cat === "all" || empRubros.includes(cat);
    const matchZona =
      zona === "all" || e.ubicacion === zona || e.envios === true;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.nombre.toLowerCase().includes(q) ||
      e.rubro.toLowerCase().includes(q) ||
      (e.ubicacion?.toLowerCase().includes(q) ?? false) ||
      (e.envios === true && q.length > 0) ||
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

  function getBadges(e: Emp, esMio: boolean) {
    const badges = [];
    const tieneFotos = (e.images?.filter(Boolean).length ?? 0) > 0;
    const tieneDatos = !!(e.nombre && e.rubro && e.tagline && e.descripcion);

    if (e.plan === "premium")
      badges.push({ label: "⭐ Pro", color: "#C9A84C" });

    if (tieneDatos && tieneFotos) {
      badges.push({ label: "✅ Verificado", color: "#6B7A5A", tooltip: null });
    } else {
      // construir tooltip solo si es el dueño
      let tooltip: string | null = null;
      if (esMio) {
        const falta = [];
        if (!e.descripcion) falta.push("descripción");
        if (!e.tagline) falta.push("tagline");
        if (!tieneFotos) falta.push("fotos");
        tooltip = `Completá tu perfil → Falta: ${falta.join(", ")}`;
      }
      badges.push({ label: "🏪 Activo", color: "#7A756A", tooltip });
    }

    return badges;
  }

  return (
    <div className={styles.page}>
      {banner && (
        <div
          style={{
            background: "#1A3C6E",
            color: "#F5F0E8",
            textAlign: "center",
            padding: "12px 20px",
            fontSize: 14,
            fontFamily: "Syne, sans-serif",
            fontWeight: 600,
            letterSpacing: 0.3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            position: "relative",
          }}
        >
          <span>🇦🇷</span>
          <span>
            Juntos hacemos grande a la Argentina — comprá local, apoyá al
            emprendedor nacional
          </span>
          <span>🇦🇷</span>
          <button
            onClick={() => setBanner(false)}
            style={{
              position: "absolute",
              right: 16,
              background: "none",
              border: "none",
              color: "#F5F0E8",
              fontSize: 16,
              cursor: "pointer",
              opacity: 0.6,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <NavPublico />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          Directorio de emprendimientos argentinos
        </div>
        <h1 className={styles.heroTitle}>
          Todo lo que buscás,
          <br />
          hecho por <em>manos argentinas.</em>
        </h1>
        <p className={styles.heroSub}>
          Descubrí los mejores emprendimientos locales en un solo lugar. Comprá
          directo, apoyá el talento nacional y conectá con la red de creadores
          más grande del país.
        </p>
        <div className={styles.heroCtaRow}>
          <a
            href="#grid"
            className={styles.heroBtn}
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            Explorar Emprendimientos →
          </a>
          <Link
            href="/register"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              padding: "0 28px",
              height: "48px",
              borderRadius: "100px",
              border: "1.5px solid var(--black)",
              color: "var(--black)",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              background: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            Sumar mi Negocio →
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
            <span className={styles.statNum}>{categoriasExtra.length}</span>
            <span className={styles.statLabel}>Categorías</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>AR</span>
            <span className={styles.statLabel}>Independiente</span>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section
        onMouseEnter={() => setFeaturesOpen(true)}
        onMouseLeave={() => setFeaturesOpen(false)}
        style={{
          background: "#F5F0E8",
          padding: featuresOpen ? "80px 5vw" : "32px 5vw",
          borderTop: "1px solid var(--border)",
          transition: "padding 0.4s ease",
          cursor: "default",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--olive)",
                  marginBottom: 6,
                  margin: 0,
                }}
              >
                Para emprendedores
              </p>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(22px, 3vw, 32px)",
                  color: "var(--black)",
                  letterSpacing: -0.5,
                  margin: "6px 0 0",
                }}
              >
                Todo lo que necesitás para vender
              </h2>
            </div>
            <span
              style={{
                fontSize: 18,
                color: "var(--muted)",
                transition: "transform 0.3s",
                transform: featuresOpen ? "rotate(45deg)" : "none",
                display: "inline-block",
              }}
            >
              +
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateRows: featuresOpen ? "1fr" : "0fr",
              marginTop: featuresOpen ? 48 : 0,
              transition: "grid-template-rows 0.4s ease, margin-top 0.4s ease",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  {
                    icon: "🪟",
                    title: "Vitrina profesional",
                    desc: "Tu página con link propio para compartir por WhatsApp, Instagram o donde quieras.",
                    plan: null,
                  },
                  {
                    icon: "🛍️",
                    title: "Catálogo y carrito",
                    desc: "Tus productos con fotos, precios y compra directa. Sin redirigir a ningún lado.",
                    plan: "Pro",
                  },
                  {
                    icon: "🚫",
                    title: "Sin comisión por venta",
                    desc: "Lo que vendés, lo cobrás vos entero. Cero intermediarios, cero sorpresas.",
                    plan: null,
                  },
                  {
                    icon: "📊",
                    title: "Métricas",
                    desc: "Sabé cuánto vendés, qué productos funcionan y cómo crece tu negocio mes a mes.",
                    plan: "Pro",
                  },
                  {
                    icon: "🧾",
                    title: "Planilla de ventas y costos",
                    desc: "Calculá tu ganancia real por producto. Registrá ventas y conocé tu punto de equilibrio.",
                    plan: "Pro",
                  },
                  {
                    icon: "🛒",
                    title: "Integración con Mercado Libre",
                    desc: "Sincronizá tu stock y vendé en los dos canales al mismo tiempo, sin doble trabajo.",
                    plan: "Pro",
                  },
                  {
                    icon: "⭐",
                    title: "Posicionamiento Pro",
                    desc: "Aparecés primero cuando los compradores buscan en Viko. Más visibilidad, más ventas.",
                    plan: "Pro",
                  },
                  {
                    icon: "📱",
                    title: "Compatible con todos los dispositivos",
                    desc: "Tu vitrina se ve perfecta en celular, tablet y computadora, sin configuración extra.",
                    plan: null,
                  },
                ].map((f) => (
                  <FeatureCard key={f.title} {...f} />
                ))}
              </div>
            </div>
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

      {/* CATEGORÍAS — dinámicas */}
      <div className={styles.catsWrap}>
        <div className={styles.cats}>
          {CATEGORIAS_DINAMICAS.map((c) => (
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
              const esMio = e.id === miEmpId;
              const img = e.images?.find((i) => i && i.trim() !== "") ?? null;
              const badges = getBadges(e, esMio);
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
                      <Image
                        src="/viko-placeholder.png"
                        alt="Sin imagen"
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 700px) 100vw, 33vw"
                      />
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
                            title={b.tooltip ?? undefined}
                            onClick={
                              b.tooltip
                                ? (ev) => {
                                    ev.stopPropagation();
                                    router.push("/dashboard?view=perfil");
                                  }
                                : undefined
                            }
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
                <li className={styles.featureOff}>✕ Tienda online + QR</li>
              </ul>
              <Link
                href={isLoggedIn ? "/dashboard?view=planes" : "/register"}
                className={styles.planCtaSecondary}
              >
                {isLoggedIn ? "Ver mi plan →" : "Empezar gratis →"}
              </Link>
            </div>
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
                <li>✓ Tienda online + QR propio</li>
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

      {/* FAQ */}
      <section
        id="faq"
        style={{ background: "var(--white)", padding: "72px 5vw" }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: faqOpen ? 48 : 0,
            }}
            onClick={() => setFaqOpen(!faqOpen)}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                FAQ
              </p>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 32,
                  color: "var(--black)",
                  letterSpacing: -0.5,
                  margin: 0,
                }}
              >
                Preguntas frecuentes
              </h2>
            </div>
            <span
              style={{
                fontSize: 18,
                color: "var(--muted)",
                transition: "transform 0.3s",
                transform: faqOpen ? "rotate(45deg)" : "none",
                display: "inline-block",
              }}
            >
              +
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateRows: faqOpen ? "1fr" : "0fr",
              transition: "grid-template-rows 0.4s ease",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              {FAQS.map((grupo) => (
                <div key={grupo.grupo} style={{ marginBottom: 40 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "var(--olive)",
                      marginBottom: 4,
                    }}
                  >
                    {grupo.grupo}
                  </p>
                  {grupo.items.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              ))}
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
          Admin
        </Link>
        <span className={styles.footerCopy}>
          © 2026 Viko — Directorio de emprendimientos seleccionados.
        </span>
        <a
          href="mailto:diegoalami@gmail.com"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textDecoration: "none",
          }}
        >
          Soporte: soporte@viko.com.ar
        </a>
      </footer>
    </div>
  );
}
