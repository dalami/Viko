"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

interface Post {
  id: number;
  tipo: string;
  contenido: string;
  likes: number;
  visible: boolean;
  created_at: string;
  emprendimientos:
    | { id: number; nombre: string; rubro: string; slug: string }
    | { id: number; nombre: string; rubro: string; slug: string }[]
    | null;
}

interface Emp {
  id: number;
  nombre: string;
  rubro: string;
  plan: string;
  visible: boolean;
  slug: string;
  created_at: string;
}

export default function AdminClient({
  posts: initialPosts,
  emprendimientos: initialEmps,
  reportesPorPost,
}: {
  posts: Post[];
  emprendimientos: Emp[];
  reportesPorPost: Record<number, number>;
}) {
  const [tab, setTab] = useState<"posts" | "emprendimientos">("posts");
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [emps, setEmps] = useState<Emp[]>(initialEmps);
  const supabase = createClient();

  async function eliminarPost(id: number) {
    if (!confirm("¿Eliminás este post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleVisiblePost(id: number, visible: boolean) {
    await supabase.from("posts").update({ visible: !visible }).eq("id", id);
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !visible } : p)),
    );
  }

  async function cambiarPlan(id: number, plan: string) {
    await supabase.from("emprendimientos").update({ plan }).eq("id", id);
    setEmps((prev) => prev.map((e) => (e.id === id ? { ...e, plan } : e)));
  }

  async function toggleVisibleEmp(id: number, visible: boolean) {
    await supabase
      .from("emprendimientos")
      .update({ visible: !visible })
      .eq("id", id);
    setEmps((prev) =>
      prev.map((e) => (e.id === id ? { ...e, visible: !visible } : e)),
    );
  }

  const PLAN_COLORS: Record<string, string> = {
    basic: "#9A958A",
    featured: "#4A90D9",
    premium: "#C9A84C",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F0EBE1" }}>
      {/* NAV */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 60,
          background: "#1A1814",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 20,
              color: "#FAFAF7",
            }}
          >
            Viko<span style={{ color: "#C9A84C" }}>.</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 100,
              background: "#C4664A",
              color: "#fff",
            }}
          >
            Admin
          </span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link
            href="/feed"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}
          >
            Comunidad
          </Link>
          <Link
            href="/directorio"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}
          >
            Directorio
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px" }}>
        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            { label: "Emprendimientos", value: emps.length },
            {
              label: "Plan Pro",
              value: emps.filter((e) => e.plan === "premium").length,
            },
            { label: "Posts", value: posts.length },
            {
              label: "Reportados",
              value: Object.values(reportesPorPost).filter((v) => v > 0).length,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#FAFAF7",
                borderRadius: 16,
                padding: "20px 24px",
                border: "1px solid rgba(26,24,20,0.08)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#7A756A",
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                {s.label}
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#1A1814" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["posts", "emprendimientos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "9px 20px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                border: `1.5px solid ${tab === t ? "#1A1814" : "rgba(26,24,20,0.12)"}`,
                background: tab === t ? "#1A1814" : "transparent",
                color: tab === t ? "#FAFAF7" : "#7A756A",
                cursor: "pointer",
              }}
            >
              {t === "posts"
                ? `💬 Posts (${posts.length})`
                : `🏪 Emprendimientos (${emps.length})`}
            </button>
          ))}
        </div>

        {/* POSTS */}
        {tab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {posts.map((post) => {
              const emp = Array.isArray(post.emprendimientos)
                ? post.emprendimientos[0]
                : post.emprendimientos;
              const reportes = reportesPorPost[post.id] || 0;
              return (
                <div
                  key={post.id}
                  style={{
                    background: "#FAFAF7",
                    borderRadius: 16,
                    padding: "16px 20px",
                    border: `1px solid ${reportes > 0 ? "rgba(196,102,74,0.3)" : "rgba(26,24,20,0.08)"}`,
                    opacity: post.visible ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#7A756A",
                        }}
                      >
                        {emp?.nombre || "Desconocido"} · {post.tipo}
                        {reportes > 0 && (
                          <span style={{ color: "#C4664A", marginLeft: 8 }}>
                            ⚠️ {reportes} reporte{reportes > 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#1A1814",
                          marginTop: 6,
                          lineHeight: 1.6,
                        }}
                      >
                        {post.contenido}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexShrink: 0,
                        marginLeft: 16,
                      }}
                    >
                      <button
                        onClick={() => toggleVisiblePost(post.id, post.visible)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 600,
                          border: "1px solid rgba(26,24,20,0.12)",
                          background: "transparent",
                          color: "#7A756A",
                          cursor: "pointer",
                        }}
                      >
                        {post.visible ? "🙈 Ocultar" : "👁️ Mostrar"}
                      </button>
                      <button
                        onClick={() => eliminarPost(post.id)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "none",
                          background: "#C4664A",
                          color: "#FAFAF7",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 11,
                      color: "#9A958A",
                    }}
                  >
                    <span>👍 {post.likes} likes</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString("es-AR")}
                    </span>
                    {emp && (
                      <Link
                        href={`/emprendimiento/${emp.slug}`}
                        style={{ color: "#6B7A5A", textDecoration: "none" }}
                      >
                        Ver ficha →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPRENDIMIENTOS */}
        {tab === "emprendimientos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {emps.map((emp) => (
              <div
                key={emp.id}
                style={{
                  background: "#FAFAF7",
                  borderRadius: 16,
                  padding: "14px 20px",
                  border: "1px solid rgba(26,24,20,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: emp.visible ? 1 : 0.5,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{ fontSize: 14, fontWeight: 700, color: "#1A1814" }}
                  >
                    {emp.nombre}
                  </p>
                  <p style={{ fontSize: 11, color: "#9A958A" }}>
                    {emp.rubro} ·{" "}
                    {new Date(emp.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: PLAN_COLORS[emp.plan] + "20",
                    color: PLAN_COLORS[emp.plan],
                    border: `1px solid ${PLAN_COLORS[emp.plan]}40`,
                  }}
                >
                  {emp.plan}
                </span>

                <select
                  value={emp.plan}
                  onChange={(e) => cambiarPlan(emp.id, e.target.value)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    border: "1px solid rgba(26,24,20,0.12)",
                    background: "#F5F0E8",
                    cursor: "pointer",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  <option value="basic">Básico</option>
                  <option value="featured">Destacado</option>
                  <option value="premium">Premium</option>
                </select>

                <button
                  onClick={() => toggleVisibleEmp(emp.id, emp.visible)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid rgba(26,24,20,0.12)",
                    background: "transparent",
                    color: "#7A756A",
                    cursor: "pointer",
                  }}
                >
                  {emp.visible ? "🙈 Ocultar" : "👁️ Mostrar"}
                </button>

                <Link
                  href={`/emprendimiento/${emp.slug}`}
                  style={{
                    fontSize: 11,
                    color: "#6B7A5A",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Ver →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
