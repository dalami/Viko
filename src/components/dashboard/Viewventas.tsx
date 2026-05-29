"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { createClient } from "../../lib/supabase";
import type { Producto } from "../../lib/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface VentaItem {
  productoId: string; // Producto.id es string (UUID)
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface Jornada {
  id: string;
  emprendimiento_id: number;
  canal: string;
  fecha: string;
  items: VentaItem[];
  total: number;
  cerrada: boolean;
  created_at: string;
}

type Pantalla = "home" | "registrar" | "resumen" | "historial";

interface Props {
  empId: number;
  isPro: boolean;
  productos: Producto[];
  onUpgrade: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPeso(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ViewVentas({
  empId,
  isPro,
  productos,
  onUpgrade,
}: Props) {
  const supabase = createClient();
  const [pantalla, setPantalla] = useState<Pantalla>("home");
  const [jornadaActiva, setJornadaActiva] = useState<Jornada | null>(null);
  const [historial, setHistorial] = useState<Jornada[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    const hoy = new Date().toISOString().split("T")[0];

    const { data: abierta } = await supabase
      .from("ventas_jornadas")
      .select("*")
      .eq("emprendimiento_id", empId)
      .eq("cerrada", false)
      .gte("fecha", hoy)
      .maybeSingle();

    const query = supabase
      .from("ventas_jornadas")
      .select("*")
      .eq("emprendimiento_id", empId)
      .eq("cerrada", true)
      .order("fecha", { ascending: false });

    if (!isPro) query.limit(5);
    const { data: hist } = await query;

    // Todos los setState juntos — sin cascada
    startTransition(() => {
      setHistorial((hist ?? []) as Jornada[]);
      if (abierta) {
        setJornadaActiva({
          ...abierta,
          items: (abierta.items ?? []) as VentaItem[],
        });
        setPantalla("registrar");
      }
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId, isPro]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Iniciar jornada ───────────────────────────────────────────────────────
  async function iniciarJornada(canal: string): Promise<void> {
    const hoy = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("ventas_jornadas")
      .insert({
        emprendimiento_id: empId,
        canal: canal.trim(),
        fecha: hoy,
        items: [],
        total: 0,
        cerrada: false,
      })
      .select()
      .single();

    if (!error && data) {
      setJornadaActiva({ ...data, items: [] });
      setPantalla("registrar");
    }
  }

  // ── Registrar venta ───────────────────────────────────────────────────────
  async function registrarVenta(producto: Producto): Promise<void> {
    if (!jornadaActiva) return;

    const precio =
      producto.precio_descuento && producto.precio_descuento < producto.precio
        ? producto.precio_descuento
        : producto.precio;

    const items = [...jornadaActiva.items];
    const idx = items.findIndex((i) => i.productoId === producto.id);

    if (idx >= 0) {
      items[idx] = { ...items[idx], cantidad: items[idx].cantidad + 1 };
    } else {
      items.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio,
        cantidad: 1,
        imagen: producto.imagen ?? undefined,
      });
    }

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const actualizada = { ...jornadaActiva, items, total };

    await supabase
      .from("ventas_jornadas")
      .update({ items, total })
      .eq("id", jornadaActiva.id);
    setJornadaActiva(actualizada);
  }

  // ── Quitar unidad ─────────────────────────────────────────────────────────
  async function quitarUnidad(productoId: string): Promise<void> {
    if (!jornadaActiva) return;

    const items = jornadaActiva.items
      .map((i) =>
        i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i,
      )
      .filter((i) => i.cantidad > 0);

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const actualizada = { ...jornadaActiva, items, total };

    await supabase
      .from("ventas_jornadas")
      .update({ items, total })
      .eq("id", jornadaActiva.id);
    setJornadaActiva(actualizada);
  }

  // ── Cerrar jornada ────────────────────────────────────────────────────────
  async function cerrarJornada(): Promise<void> {
    if (!jornadaActiva) return;
    await supabase
      .from("ventas_jornadas")
      .update({ cerrada: true })
      .eq("id", jornadaActiva.id);
    const cerrada = { ...jornadaActiva, cerrada: true };
    setHistorial((prev) => [cerrada, ...prev]);
    setJornadaActiva(null);
    setPantalla("resumen");
  }

  // ── Compartir WhatsApp ────────────────────────────────────────────────────
  function compartirResumen(jornada: Jornada): void {
    const lineas = jornada.items.map(
      (i) =>
        `• ${i.nombre} ×${i.cantidad} = ${formatPeso(i.precio * i.cantidad)}`,
    );
    const texto = [
      `🧾 Resumen de ventas — ${jornada.canal}`,
      `📅 ${fechaCorta(jornada.fecha)}`,
      "",
      ...lineas,
      "",
      `💰 Total: ${formatPeso(jornada.total)}`,
      "",
      "Registrado con Viko 📲",
    ].join("\n");
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  }

  if (cargando) return <div style={s.loading}>Cargando...</div>;

  if (pantalla === "home") {
    return (
      <PantallaHome
        historial={historial}
        isPro={isPro}
        onHistorial={() => setPantalla("historial")}
        onUpgrade={onUpgrade}
        onIniciarConCanal={iniciarJornada}
        formatPeso={formatPeso}
        fechaCorta={fechaCorta}
      />
    );
  }

  if (pantalla === "registrar" && jornadaActiva) {
    return (
      <PantallaRegistrar
        jornada={jornadaActiva}
        productos={productos.filter((p) => p.activo !== false)}
        onVender={registrarVenta}
        onQuitar={quitarUnidad}
        onCerrar={cerrarJornada}
        onVolver={() => {
          setJornadaActiva(null);
          setPantalla("home");
        }}
        formatPeso={formatPeso}
      />
    );
  }

  if (pantalla === "resumen") {
    const ultima = historial[0] ?? null;
    return (
      <PantallaResumen
        jornada={ultima}
        onCompartir={() => ultima && compartirResumen(ultima)}
        onNueva={() => setPantalla("home")}
        onHistorial={() => setPantalla("historial")}
        formatPeso={formatPeso}
        fechaCorta={fechaCorta}
      />
    );
  }

  if (pantalla === "historial") {
    return (
      <PantallaHistorial
        historial={historial}
        isPro={isPro}
        onCompartir={compartirResumen}
        onVolver={() => setPantalla("home")}
        onUpgrade={onUpgrade}
        formatPeso={formatPeso}
        fechaCorta={fechaCorta}
      />
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════════════════════
interface HomeProps {
  historial: Jornada[];
  isPro: boolean;
  onHistorial: () => void;
  onUpgrade: () => void;
  onIniciarConCanal: (canal: string) => void;
  formatPeso: (n: number) => string;
  fechaCorta: (iso: string) => string;
}

function getCanalesGuardados(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("viko_canales") ?? "[]") as string[];
  } catch {
    return [];
  }
}

function PantallaHome({
  historial,
  isPro,
  onHistorial,
  onUpgrade,
  onIniciarConCanal,
  formatPeso,
  fechaCorta,
}: HomeProps) {
  const [canal, setCanal] = useState("");
  const [canalesGuardados, setCanalesGuardados] =
    useState<string[]>(getCanalesGuardados);

  function iniciar(c: string): void {
    if (!c.trim()) return;
    const nuevos = [
      c.trim(),
      ...canalesGuardados.filter((x) => x !== c.trim()),
    ].slice(0, 8);
    localStorage.setItem("viko_canales", JSON.stringify(nuevos));
    setCanalesGuardados(nuevos);
    onIniciarConCanal(c.trim());
  }

  const totalMes = historial
    .filter((j) => j.fecha.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, j) => s + j.total, 0);

  return (
    <div style={s.wrap}>
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Mis Ventas</h2>
        <p style={s.pageSub}>
          Registrá cada jornada y conocé cómo crece tu negocio.
        </p>
        <div style={s.descBox}>
          <span style={s.descIcon}>🧾</span>
          <p style={s.descText}>
            Cada vez que vendés — en una feria, por Instagram, en un evento o
            puerta a puerta — registrá tus productos con un tap. Con el tiempo
            vas a saber qué canal te rinde más, qué producto vende mejor y
            cuánto facturaste en el mes. Todo sin planillas ni papeles.
          </p>
        </div>
      </div>

      {historial.length > 0 && (
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <span style={s.statNum}>{formatPeso(totalMes)}</span>
            <span style={s.statLbl}>este mes</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statNum}>{historial.length}</span>
            <span style={s.statLbl}>jornadas registradas</span>
          </div>
        </div>
      )}

      <div style={s.card}>
        <p style={s.cardTitle}>¿Dónde vendés hoy?</p>
        <p style={s.cardSub}>
          Podés poner el lugar, el día, el canal — lo que te ayude a identificar
          la jornada después.
        </p>

        {canalesGuardados.length > 0 && (
          <div style={s.chipsRow}>
            {canalesGuardados.map((c) => (
              <button key={c} style={s.chip} onClick={() => iniciar(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div style={s.inputRow}>
          <input
            style={s.input}
            placeholder="Ej: Feria de Palermo, Sábado 31, Instagram..."
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && iniciar(canal)}
            maxLength={60}
          />
          <button
            style={{ ...s.btnPrimary, opacity: canal.trim() ? 1 : 0.5 }}
            onClick={() => iniciar(canal)}
            disabled={!canal.trim()}
          >
            Iniciar →
          </button>
        </div>
      </div>

      {historial.length > 0 && (
        <div style={s.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <p style={{ ...s.cardTitle, marginBottom: 0 }}>Últimas jornadas</p>
            <button style={s.btnLink} onClick={onHistorial}>
              Ver todas →
            </button>
          </div>
          {historial.slice(0, 3).map((j) => (
            <div key={j.id} style={s.jornadaRow}>
              <div>
                <p style={s.jornadaNombre}>{j.canal}</p>
                <p style={s.jornadaFecha}>
                  {fechaCorta(j.fecha)} · {j.items.length} productos
                </p>
              </div>
              <p style={s.jornadaTotal}>{formatPeso(j.total)}</p>
            </div>
          ))}
          {!isPro && (
            <div style={s.proGate}>
              <p style={s.proGateText}>
                Historial completo y analytics disponibles en Pro
              </p>
              <button style={s.btnPro} onClick={onUpgrade}>
                Ver planes ⚡
              </button>
            </div>
          )}
        </div>
      )}

      {historial.length === 0 && (
        <div style={s.emptyState}>
          <p style={s.emptyIcon}>🧾</p>
          <p style={s.emptyTitle}>Todavía no registraste ninguna venta</p>
          <p style={s.emptySub}>
            Iniciá tu primera jornada arriba y empezá a conocer cómo va tu
            negocio.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRAR
// ═══════════════════════════════════════════════════════════════════════════════
interface RegistrarProps {
  jornada: Jornada;
  productos: Producto[];
  onVender: (p: Producto) => void;
  onQuitar: (id: string) => void;
  onCerrar: () => void;
  onVolver: () => void;
  formatPeso: (n: number) => string;
}

function PantallaRegistrar({
  jornada,
  productos,
  onVender,
  onQuitar,
  onCerrar,
  onVolver,
  formatPeso,
}: RegistrarProps) {
  const [busqueda, setBusqueda] = useState("");
  const totalHoy = jornada.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const prodsFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  function cantidadVendida(prodId: string): number {
    return jornada.items.find((i) => i.productoId === prodId)?.cantidad ?? 0;
  }

  return (
    <div style={s.wrap}>
      <div style={s.jornadaHeader}>
        <div>
          <p style={s.jornadaHeaderCanal}>{jornada.canal}</p>
          <p style={s.jornadaHeaderSub}>
            Jornada activa — tocá un producto para registrar
          </p>
        </div>
        <div style={s.totalBig}>{formatPeso(totalHoy)}</div>
      </div>

      <input
        style={{ ...s.input, marginBottom: 12 }}
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div style={s.productosGrid}>
        {prodsFiltrados.map((p) => {
          const cant = cantidadVendida(p.id);
          const precio =
            p.precio_descuento && p.precio_descuento < p.precio
              ? p.precio_descuento
              : p.precio;
          return (
            <div
              key={p.id}
              style={{
                ...s.productoCelda,
                ...(cant > 0 ? s.productoCeldaActiva : {}),
              }}
              onClick={() => onVender(p)}
            >
              {p.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagen} alt={p.nombre} style={s.productoImg} />
              )}
              <p style={s.productoNombre}>{p.nombre}</p>
              <p style={s.productoPrecio}>{formatPeso(precio)}</p>
              {cant > 0 && (
                <div style={s.cantBadge}>
                  <button
                    style={s.cantBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuitar(p.id);
                    }}
                  >
                    −
                  </button>
                  <span style={s.cantNum}>{cant}</span>
                  <span style={{ ...s.cantBtn, cursor: "default" }}>+</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {jornada.items.length > 0 && (
        <div style={{ ...s.card, marginTop: 16 }}>
          <p style={s.cardTitle}>Vendido hasta ahora</p>
          {jornada.items.map((item) => (
            <div key={item.productoId} style={s.itemRow}>
              <span style={s.itemNombre}>{item.nombre}</span>
              <span style={s.itemCant}>×{item.cantidad}</span>
              <span style={s.itemTotal}>
                {formatPeso(item.precio * item.cantidad)}
              </span>
            </div>
          ))}
          <div style={s.itemTotalRow}>
            <span style={s.itemTotalLbl}>Total del día</span>
            <span style={s.itemTotalNum}>{formatPeso(totalHoy)}</span>
          </div>
        </div>
      )}

      <div style={s.accionesRow}>
        <button style={s.btnSecondary} onClick={onVolver}>
          ← Volver
        </button>
        <button
          style={{
            ...s.btnPrimary,
            opacity: jornada.items.length > 0 ? 1 : 0.5,
          }}
          onClick={onCerrar}
          disabled={jornada.items.length === 0}
        >
          Cerrar jornada ✓
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════════════════════
interface ResumenProps {
  jornada: Jornada | null;
  onCompartir: () => void;
  onNueva: () => void;
  onHistorial: () => void;
  formatPeso: (n: number) => string;
  fechaCorta: (iso: string) => string;
}

function PantallaResumen({
  jornada,
  onCompartir,
  onNueva,
  onHistorial,
  formatPeso,
  fechaCorta,
}: ResumenProps) {
  if (!jornada)
    return (
      <div style={s.wrap}>
        <button style={s.btnLink} onClick={onNueva}>
          ← Volver
        </button>
      </div>
    );

  return (
    <div style={s.wrap}>
      <div style={s.resumenHero}>
        <p style={s.resumenIcon}>✅</p>
        <p style={s.resumenTitulo}>¡Jornada cerrada!</p>
        <p style={s.resumenCanal}>
          {jornada.canal} · {fechaCorta(jornada.fecha)}
        </p>
        <p style={s.resumenTotal}>{formatPeso(jornada.total)}</p>
      </div>
      <div style={s.card}>
        {jornada.items.map((item) => (
          <div key={item.productoId} style={s.itemRow}>
            <span style={s.itemNombre}>{item.nombre}</span>
            <span style={s.itemCant}>×{item.cantidad}</span>
            <span style={s.itemTotal}>
              {formatPeso(item.precio * item.cantidad)}
            </span>
          </div>
        ))}
      </div>
      <div style={s.accionesCol}>
        <button style={s.btnWA} onClick={onCompartir}>
          💬 Compartir por WhatsApp
        </button>
        <button style={s.btnPrimary} onClick={onNueva}>
          + Nueva jornada
        </button>
        <button style={s.btnLink} onClick={onHistorial}>
          Ver historial completo →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORIAL
// ═══════════════════════════════════════════════════════════════════════════════
interface HistorialProps {
  historial: Jornada[];
  isPro: boolean;
  onCompartir: (j: Jornada) => void;
  onVolver: () => void;
  onUpgrade: () => void;
  formatPeso: (n: number) => string;
  fechaCorta: (iso: string) => string;
}

function PantallaHistorial({
  historial,
  isPro,
  onCompartir,
  onVolver,
  onUpgrade,
  formatPeso,
  fechaCorta,
}: HistorialProps) {
  const canales = [...new Set(historial.map((j) => j.canal))];

  const mejorCanal = canales
    .map((canal) => {
      const jornadas = historial.filter((j) => j.canal === canal);
      const total = jornadas.reduce((s, j) => s + j.total, 0);
      return {
        canal,
        total,
        promedio: total / jornadas.length,
        jornadas: jornadas.length,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div style={s.wrap}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button style={s.btnLink} onClick={onVolver}>
          ← Volver
        </button>
        <h2 style={{ ...s.pageTitle, margin: 0 }}>Historial</h2>
      </div>

      {isPro && canales.length > 1 && (
        <div style={s.card}>
          <p style={s.cardTitle}>Por canal de venta</p>
          {mejorCanal.map((c) => (
            <div key={c.canal} style={s.jornadaRow}>
              <div>
                <p style={s.jornadaNombre}>{c.canal}</p>
                <p style={s.jornadaFecha}>
                  {c.jornadas} jornadas · promedio{" "}
                  {formatPeso(Math.round(c.promedio))}
                </p>
              </div>
              <p style={s.jornadaTotal}>{formatPeso(c.total)}</p>
            </div>
          ))}
        </div>
      )}

      {!isPro && (
        <div style={s.proGate}>
          <p style={s.proGateText}>
            📊 Analytics por canal disponibles en el plan Pro
          </p>
          <button style={s.btnPro} onClick={onUpgrade}>
            Ver planes ⚡
          </button>
        </div>
      )}

      <div style={s.card}>
        <p style={s.cardTitle}>Todas las jornadas</p>
        {historial.map((j) => (
          <div key={j.id} style={s.jornadaRow}>
            <div>
              <p style={s.jornadaNombre}>{j.canal}</p>
              <p style={s.jornadaFecha}>
                {fechaCorta(j.fecha)} · {j.items.length} productos
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={s.jornadaTotal}>{formatPeso(j.total)}</p>
              <button
                style={s.btnIconSmall}
                onClick={() => onCompartir(j)}
                title="Compartir"
              >
                💬
              </button>
            </div>
          </div>
        ))}
        {!isPro && historial.length >= 5 && (
          <p
            style={{
              fontSize: 12,
              color: "#999",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Mostrando las últimas 5. Actualizá a Pro para ver todo el historial.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: { padding: "0 0 40px", maxWidth: 640, margin: "0 auto" },
  loading: { padding: 40, textAlign: "center", color: "#888" },
  pageHeader: { marginBottom: 24 },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 6px",
    color: "#1a1a1a",
  },
  pageSub: { fontSize: 14, color: "#666", margin: 0 },
  statsRow: { display: "flex", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    background: "#f8f8f5",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  statNum: { fontSize: 20, fontWeight: 700, color: "#1a1a1a" },
  statLbl: { fontSize: 12, color: "#888" },
  card: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: "18px",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: "0 0 8px",
  },
  cardSub: { fontSize: 13, color: "#888", margin: "0 0 14px" },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    background: "#f0f0ec",
    border: "1px solid #e0e0d8",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 13,
    color: "#444",
    cursor: "pointer",
  },
  inputRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: {
    flex: 1,
    minWidth: 180,
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    color: "#1a1a1a",
    background: "#fff",
  },
  btnPrimary: {
    background: "#5a6e45",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnSecondary: {
    background: "#f0f0ec",
    color: "#444",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  btnLink: {
    background: "none",
    border: "none",
    color: "#5a6e45",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
    padding: 0,
  },
  btnWA: {
    background: "#25d366",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  btnPro: {
    background: "#f5a623",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnIconSmall: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: "2px 4px",
  },
  jornadaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8f8f5",
    borderRadius: 14,
    padding: "16px 18px",
    marginBottom: 16,
  },
  jornadaHeaderCanal: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
  },
  jornadaHeaderSub: { fontSize: 12, color: "#888", margin: "4px 0 0" },
  totalBig: { fontSize: 22, fontWeight: 700, color: "#5a6e45" },
  productosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
    marginBottom: 8,
  },
  productoCelda: {
    background: "#fff",
    border: "1.5px solid #eee",
    borderRadius: 12,
    padding: "12px 10px",
    cursor: "pointer",
    textAlign: "center",
    position: "relative",
  },
  productoCeldaActiva: { borderColor: "#5a6e45", background: "#f6f9f3" },
  productoImg: {
    width: "100%",
    height: 64,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 8,
    display: "block",
  },
  productoNombre: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: "0 0 4px",
    lineHeight: 1.3,
  },
  productoPrecio: {
    fontSize: 13,
    color: "#5a6e45",
    fontWeight: 700,
    margin: 0,
  },
  cantBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    background: "#5a6e45",
    borderRadius: 8,
    padding: "4px 8px",
  },
  cantBtn: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
    background: "none",
    border: "none",
  },
  cantNum: { color: "#fff", fontSize: 14, fontWeight: 700 },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f0f0ec",
  },
  itemNombre: { flex: 1, fontSize: 13, color: "#1a1a1a", margin: 0 },
  itemCant: {
    fontSize: 13,
    color: "#888",
    margin: 0,
    minWidth: 28,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: 0,
    minWidth: 80,
    textAlign: "right",
  },
  itemTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "2px solid #eee",
  },
  itemTotalLbl: { fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  itemTotalNum: { fontSize: 18, fontWeight: 700, color: "#5a6e45" },
  accionesRow: {
    display: "flex",
    gap: 10,
    marginTop: 20,
    justifyContent: "flex-end",
  },
  accionesCol: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
  },
  resumenHero: { textAlign: "center", padding: "32px 20px 24px" },
  resumenIcon: { fontSize: 40, margin: "0 0 12px" },
  resumenTitulo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: "0 0 4px",
  },
  resumenCanal: { fontSize: 14, color: "#888", margin: "0 0 12px" },
  resumenTotal: { fontSize: 32, fontWeight: 800, color: "#5a6e45", margin: 0 },
  jornadaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0ec",
  },
  jornadaNombre: { fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: 0 },
  jornadaFecha: { fontSize: 12, color: "#888", margin: "2px 0 0" },
  jornadaTotal: { fontSize: 15, fontWeight: 700, color: "#5a6e45", margin: 0 },
  proGate: {
    background: "#fffbf0",
    border: "1px solid #f5d88e",
    borderRadius: 12,
    padding: "14px 16px",
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  proGateText: { fontSize: 13, color: "#7a6020", margin: 0, flex: 1 },
  emptyState: { textAlign: "center", padding: "48px 20px" },
  emptyIcon: { fontSize: 40, margin: "0 0 16px" },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#444",
    margin: "0 0 8px",
  },
  emptySub: { fontSize: 14, color: "#888", margin: 0, lineHeight: 1.5 },
  descBox: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    background: "#f8f8f5",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: "12px 14px",
    marginTop: 10,
  },
  descIcon: { fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 },
  descText: { fontSize: 13, color: "#666", margin: 0, lineHeight: 1.6 },
};
