"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";

interface ItemPedido {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  variante?: { tipo: string; opcion: string } | null;
}

interface Pedido {
  id: string;
  nombre: string;
  telefono: string;
  direccion?: string;
  notas?: string;
  metodo: string;
  estado: string;
  total: number;
  items: ItemPedido[];
  created_at: string;
}

const ESTADOS = [
  "pendiente",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
] as const;
type Estado = (typeof ESTADOS)[number];

const METODOS = [
  "todos",
  "mercadopago",
  "transferencia",
  "efectivo",
  "whatsapp",
] as const;

const ESTADO_COLOR: Record<string, { bg: string; color: string }> = {
  pendiente: { bg: "#FEF2EE", color: "#C4664A" },
  confirmado: { bg: "#EFF2EB", color: "#6B7A5A" },
  enviado: { bg: "#EBF3FB", color: "#4A90D9" },
  entregado: { bg: "#F0F4EC", color: "#3D6B35" },
  cancelado: { bg: "#F5F0E8", color: "#9A958A" },
};

const METODO_LABEL: Record<string, string> = {
  mercadopago: "💳 MercadoPago",
  transferencia: "🏦 Transferencia",
  efectivo: "💵 Efectivo",
  whatsapp: "💬 WhatsApp",
};

const supabase = createClient();

export default function ViewPedidos({ empId }: { empId: number }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const { data } = await supabase
        .from("pedidos")
        .select("*")
        .eq("emprendimiento_id", empId)
        .order("created_at", { ascending: false });
      setPedidos(data ?? []);
      setLoading(false);
    }
    cargar();
  }, [empId]);

  async function cambiarEstado(id: string, estado: Estado) {
    setCambiando(id);
    await supabase.from("pedidos").update({ estado }).eq("id", id);
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
    setCambiando(null);
  }

  const filtrados = pedidos.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || p.nombre.toLowerCase().includes(q) || p.telefono.includes(q);
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    const matchMetodo = filtroMetodo === "todos" || p.metodo === filtroMetodo;
    return matchSearch && matchEstado && matchMetodo;
  });

  const totalFiltrado = filtrados.reduce((acc, p) => acc + (p.total ?? 0), 0);

  return (
    <div className={styles.view}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Pedidos</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} en total
            </p>
          </div>
          {filtrados.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>
                Total filtrado
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--black)",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                ${totalFiltrado.toLocaleString("es-AR")}
              </p>
            </div>
          )}
        </div>

        {/* Búsqueda */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 13,
              fontFamily: "inherit",
              background: "var(--cream)",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        {/* Filtros */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["todos", ...ESTADOS].map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${filtroEstado === e ? "var(--black)" : "var(--border)"}`,
                  background:
                    filtroEstado === e ? "var(--black)" : "transparent",
                  color: filtroEstado === e ? "#fff" : "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {e === "todos"
                  ? "Todos"
                  : e.charAt(0).toUpperCase() + e.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {METODOS.map((m) => (
              <button
                key={m}
                onClick={() => setFiltroMetodo(m)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${filtroMetodo === m ? "var(--olive)" : "var(--border)"}`,
                  background:
                    filtroMetodo === m ? "var(--olive)" : "transparent",
                  color: filtroMetodo === m ? "#fff" : "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {m === "todos" ? "Todos los métodos" : METODO_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Cargando pedidos...
            </p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📦</span>
            <p className={styles.emptyTitle}>
              {pedidos.length === 0
                ? "Todavía no recibiste pedidos"
                : "Sin resultados"}
            </p>
            <p className={styles.emptySub}>
              {pedidos.length === 0
                ? "Los pedidos aparecen acá cuando tus clientes compren."
                : "Probá con otro término o filtro."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtrados.map((p) => {
              const estadoStyle =
                ESTADO_COLOR[p.estado] ?? ESTADO_COLOR.pendiente;
              const isOpen = expandido === p.id;
              return (
                <div
                  key={p.id}
                  style={{
                    background: "var(--cream)",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                  }}
                >
                  {/* Row principal */}
                  <div
                    onClick={() => setExpandido(isOpen ? null : p.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "14px 16px",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--black)",
                          }}
                        >
                          {p.nombre}
                        </p>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: estadoStyle.bg,
                            color: estadoStyle.color,
                          }}
                        >
                          {p.estado}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        <span>📞 {p.telefono}</span>
                        <span>{METODO_LABEL[p.metodo] ?? p.metodo}</span>
                        <span>
                          {new Date(p.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "var(--black)",
                        fontFamily: "Syne, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ${p.total.toLocaleString("es-AR")}
                    </p>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        transition: "transform 0.2s",
                        display: "block",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      ▼
                    </span>
                  </div>

                  {/* Detalle expandido */}
                  {isOpen && (
                    <div
                      style={{
                        padding: "0 16px 16px",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {/* Items */}
                      <div style={{ marginTop: 12, marginBottom: 12 }}>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                          }}
                        >
                          Productos
                        </p>
                        {(p.items ?? []).map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                              borderBottom:
                                i < p.items.length - 1
                                  ? "1px solid var(--border)"
                                  : "none",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "var(--black)",
                                }}
                              >
                                {item.nombre} x{item.cantidad}
                              </p>
                              {item.variante && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "var(--muted)",
                                  }}
                                >
                                  {item.variante.tipo}: {item.variante.opcion}
                                </p>
                              )}
                            </div>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--black)",
                              }}
                            >
                              $
                              {(item.precio * item.cantidad).toLocaleString(
                                "es-AR",
                              )}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Datos extras */}
                      {(p.direccion || p.notas) && (
                        <div
                          style={{
                            marginBottom: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {p.direccion && (
                            <p style={{ fontSize: 12, color: "var(--muted)" }}>
                              📍 {p.direccion}
                            </p>
                          )}
                          {p.notas && (
                            <p style={{ fontSize: 12, color: "var(--muted)" }}>
                              📝 {p.notas}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Cambiar estado */}
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                          }}
                        >
                          Cambiar estado
                        </p>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {ESTADOS.map((e) => (
                            <button
                              key={e}
                              onClick={() => cambiarEstado(p.id, e)}
                              disabled={p.estado === e || cambiando === p.id}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 100,
                                fontSize: 11,
                                fontWeight: 700,
                                border: `1px solid ${p.estado === e ? ESTADO_COLOR[e].color : "var(--border)"}`,
                                background:
                                  p.estado === e
                                    ? ESTADO_COLOR[e].bg
                                    : "transparent",
                                color:
                                  p.estado === e
                                    ? ESTADO_COLOR[e].color
                                    : "var(--muted)",
                                cursor: p.estado === e ? "default" : "pointer",
                                opacity:
                                  cambiando === p.id && p.estado !== e
                                    ? 0.5
                                    : 1,
                                fontFamily: "inherit",
                              }}
                            >
                              {e.charAt(0).toUpperCase() + e.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
