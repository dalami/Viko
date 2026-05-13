"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../../../styles/dashboard.module.css";
import ViewPerfil from "../../../components/dashboard/ViewPerfil";
import ViewProductos from "../../../components/dashboard/ViewProductos";
import ViewMetricas from "../../../components/dashboard/Viewmetricas";
import { ViewLanding } from "../../../components/dashboard/Viewmetricaslanding";
import Link from 'next/link'

export interface Emprendimiento {
  id: number;
  nombre: string;
  rubro: string;
  tagline: string;
  descripcion: string;
  ubicacion: string;
  whatsapp: string;
  instagram: string;
  email: string;
  web: string;
  envios: boolean;
  visible: boolean;
  images?: string[];
  plan?: "basic" | "featured" | "premium";
  historia_origen?: string;
  historia_diferencia?: string;
  historia_cliente?: string;
  highlights?: { icono: string; texto: string }[] | null;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  categoria?: string;
  emprendimiento_id?: number;
}

interface User {
  id: string;
  email?: string;
}

const NAV = [
  { id: "perfil", label: "Mi perfil", icon: "👤" },
  { id: "productos", label: "Productos", icon: "🛍️" },
  { id: "metricas", label: "Métricas", icon: "📊" },
  { id: "landing", label: "Mi landing", icon: "🌐" },
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
  const [view, setView] = useState<ViewId>("perfil");
  const [emp, setEmp] = useState<Emprendimiento>(emprendimiento);
  const [prods, setProds] = useState<Producto[]>(productos);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  async function handleSaveProfile() {
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

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  const isPro = emp.plan === "premium";
  const initials = (emp.nombre || user.email || "V").slice(0, 2).toUpperCase();
  const slug = (emp.nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            Viko<span className={styles.logoDot}>.</span>
          </div>
          <p className={styles.logoSub}>Panel de emprendedor</p>
        </div>

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
              {!isPro &&
                (n.id === "productos" ||
                  n.id === "metricas" ||
                  n.id === "landing") && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      color: "#C9A84C",
                    }}
                  >
                    Pro
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge}>
            <span className={styles.planLabel}>Plan actual</span>
            <span className={styles.planName}>
              {isPro
                ? "Viko Pro"
                : emp.plan === "featured"
                  ? "Destacado"
                  : "Básico"}
            </span>
          </div>

          {!isPro && (
            <button className={styles.upgradeBtn} onClick={handleUpgrade}>
              ⚡ Activar Viko Pro
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
            <Link
              href="/directorio"
              style={{
                fontSize: 12,
                color: "#7A756A",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 100,
                border: "1px solid rgba(26,24,20,0.12)",
              }}
            >
              ← Directorio
            </Link>
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
            <ViewPerfil emp={emp} setEmp={setEmp} userId={user.id} />
          )}
          {view === "productos" && (
            <ViewProductos
              empId={emp.id}
              isPro={isPro}
              productos={prods}
              setProductos={setProds}
            />
          )}
          {view === "metricas" && (
            <ViewMetricas empId={emp.id} isPro={isPro} emp={emp} />
          )}
          {view === "landing" && (
            <ViewLanding emp={emp} slug={slug} isPro={isPro} />
          )}
        </div>
      </div>
    </div>
  );
}
