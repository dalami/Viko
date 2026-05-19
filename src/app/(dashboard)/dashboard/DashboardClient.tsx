"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../../../styles/dashboard.module.css";
import ViewPerfil from "../../../components/dashboard/ViewPerfil";
import ViewProductos from "../../../components/dashboard/ViewProductos";
import ViewMetricas from "../../../components/dashboard/Viewmetricas";
import { ViewLanding } from "../../../components/dashboard/Viewmetricaslanding";
import ViewPlanes from "../../../components/dashboard/Viewplanes";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { slugify, planLabel } from "../../../lib/utils";
import type { Emprendimiento, Producto } from "../../../lib/types";
import ViewPedidos from "../../../components/dashboard/Viewpedidos";

interface User {
  id: string;
  email?: string;
}

const NAV = [
  { id: "perfil", label: "Mi perfil", icon: "👤" },
  { id: "productos", label: "Productos", icon: "🛍️" },
  { id: "pedidos", label: "Pedidos", icon: "📦" },
  { id: "metricas", label: "Métricas", icon: "📊" },
  { id: "landing", label: "Mi landing", icon: "🌐" },
  { id: "planes", label: "Planes", icon: "⚡" },
] as const;

type ViewId = (typeof NAV)[number]["id"];

export default function DashboardClient({
  user,
  emprendimiento,
  productos,
}: {
  user: User;
  emprendimiento: Emprendimiento;
  productos: Producto[];
}) {
  const searchParams = useSearchParams();
  const mpStatus = searchParams.get("mp");
  const initialView = (searchParams.get("view") as ViewId) ?? "perfil";
  const [view, setView] = useState<ViewId>(initialView);
  const [emp, setEmp] = useState<Emprendimiento>(emprendimiento);
  const [prods, setProds] = useState<Producto[]>(productos);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  async function handleSaveProfile() {
    if (!emp.images?.[0]) {
      setSaveMsg("⚠️ Necesitás subir al menos una foto antes de guardar.");
      setTimeout(() => setSaveMsg(null), 3000);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("emprendimientos")
      .update({
        nombre: emp.nombre,
        rubro: emp.rubro,
        tagline: emp.tagline,
        descripcion: emp.descripcion,
        ubicacion: emp.ubicacion,
        whatsapp: emp.whatsapp,
        instagram: emp.instagram,
        email: emp.email,
        web: emp.web,
        envios: emp.envios,
        visible: emp.visible,
        historia_origen: emp.historia_origen,
        historia_diferencia: emp.historia_diferencia,
        historia_cliente: emp.historia_cliente,
        highlights: emp.highlights,
        transferencia_activa: emp.transferencia_activa,
        transferencia_cbu: emp.transferencia_cbu,
        efectivo_activo: emp.efectivo_activo,
        plantilla: emp.plantilla,
      })
      .eq("user_id", user.id);

    setSaving(false);
    setSaveMsg(error ? `Error: ${error.message}` : "¡Guardado!");
    setTimeout(() => setSaveMsg(null), 2500);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleUpgrade(periodo: "mensual" | "anual" = "mensual") {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodo }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  const isPro = emp.plan === "premium";
  const initials = (emp.nombre || user.email || "V").slice(0, 2).toUpperCase();
  const slug = slugify(emp.nombre || "");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            Viko<span className={styles.logoDot}>.</span>
          </div>
          <p className={styles.logoSub}>Panel de emprendedor</p>
        </div>

        <Link href="/feed" className={styles.sidebarLink}>
          <span>💬</span>
          Comunidad
        </Link>

        <nav className={styles.nav}>
          <p className={styles.navSection}>Principal</p>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`${styles.navItem} ${view === n.id ? styles.navActive : ""}`}
              onClick={() => setView(n.id)}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {n.label}
              {!isPro && (n.id === "metricas" || n.id === "landing") && (
                <span className={styles.navItemPro}>Pro</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge}>
            <span className={styles.planLabel}>Plan actual</span>
            <span className={styles.planName}>{planLabel(emp.plan)}</span>
          </div>

          {!isPro && (
            <button
              className={styles.upgradeBtn}
              onClick={() => setView("planes")}
            >
              ⚡ Ver planes
            </button>
          )}

          <button className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarTitle}>
            {NAV.find((n) => n.id === view)?.label || "Panel"}
          </span>
          <div className={styles.topbarRight}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenu(true)}
            >
              ☰
            </button>
            <Link href="/directorio" className={styles.topbarBackLink}>
              ← Directorio
            </Link>
            {mpStatus === "conectado" && (
              <span style={{ fontSize: 13, color: "#6B7A5A", fontWeight: 600 }}>
                ✅ MercadoPago conectado
              </span>
            )}
            {saveMsg && <span className={styles.saveMsg}>{saveMsg}</span>}
            {view === "perfil" && (
              <button
                className={`btn btn-olive ${styles.saveBtn}`}
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            <div className={styles.avatar}>{initials}</div>
          </div>
        </div>

        <div className={styles.content}>
          {view === "perfil" && (
            <ViewPerfil
              emp={emp}
              setEmp={setEmp}
              userId={user.id}
              onUpgrade={handleUpgrade}
            />
          )}
          {view === "productos" && (
            <ViewProductos
              empId={emp.id}
              userId={user.id}
              isPro={isPro}
              mpConnected={emp.mp_connected ?? false}
              empNombre={emp.nombre}
              productos={prods}
              setProductos={setProds}
              plantilla={emp.plantilla}
              onUpgrade={handleUpgrade}
              onPlantillaChange={(p) =>
                setEmp((prev) => ({ ...prev, plantilla: p }))
              }
            />
          )}

          {view === "pedidos" && <ViewPedidos empId={emp.id} />}
          {view === "metricas" && (
            <ViewMetricas
              empId={emp.id}
              isPro={isPro}
              emp={emp}
              onUpgrade={handleUpgrade}
            />
          )}
          {view === "landing" && (
            <ViewLanding
              emp={emp}
              slug={slug}
              isPro={isPro}
              onUpgrade={handleUpgrade}
            />
          )}
          {view === "planes" && (
            <ViewPlanes currentPlan={emp.plan} onUpgrade={handleUpgrade} />
          )}
        </div>
      </div>
      {/* Mobile bottom nav */}
      <div className={styles.mobileNav}>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`${styles.mobileNavItem} ${view === n.id ? styles.mobileNavItemActive : ""}`}
            onClick={() => setView(n.id)}
          >
            <span>{n.icon}</span>
            <span>{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Mobile menu drawer */}
      {mobileMenu && (
        <>
          <div
            className={styles.mobileMenuOverlay}
            onClick={() => setMobileMenu(false)}
          />
          <div className={styles.mobileMenuDrawer}>
            <div style={{ marginBottom: 24 }}>
              <div className={styles.logo}>
                Viko<span className={styles.logoDot}>.</span>
              </div>
              <p className={styles.logoSub}>Panel de emprendedor</p>
            </div>
            <div className={styles.planBadge} style={{ marginBottom: 16 }}>
              <span className={styles.planLabel}>Plan actual</span>
              <span className={styles.planName}>{planLabel(emp.plan)}</span>
            </div>
            {!isPro && (
              <button
                className={styles.upgradeBtn}
                onClick={() => {
                  setView("planes");
                  setMobileMenu(false);
                }}
                style={{ marginBottom: 12 }}
              >
                ⚡ Ver planes
              </button>
            )}
            <Link
              href="/directorio"
              className={styles.sidebarLink}
              style={{ padding: "10px 0" }}
            >
              ← Directorio
            </Link>
            <Link
              href="/feed"
              className={styles.sidebarLink}
              style={{ padding: "10px 0" }}
            >
              💬 Comunidad
            </Link>
            <div style={{ flex: 1 }} />
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
