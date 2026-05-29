"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { createClient } from "../../lib/supabase";
import type { Producto } from "../../lib/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface VentaItem {
  productoId: string;
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

// Costos variables desglosados por producto
interface CostosVariables {
  materia_prima: number;
  insumos: number;
  packaging: number;
  mano_de_obra: number;
  otros: number;
}

interface CostoProducto {
  productoId: string;
  nombre: string;
  precio_venta: number;
  variables: CostosVariables;
  unidades_mes_estimadas: number; // para distribuir los fijos
}

// Costos fijos desglosados
interface CostosFijos {
  alquiler: number;
  electricidad: number;
  internet: number;
  monotributo: number;
  herramientas: number;
  otros: number;
}

interface CostosConfig {
  id?: string;
  emprendimiento_id: number;
  fijos: CostosFijos;
  porcentaje_reinversion: number;
  productos: CostoProducto[];
}

type Tab = "ventas" | "costos";
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

function getCanalesGuardados(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("viko_canales") ?? "[]") as string[]; }
  catch { return []; }
}

function totalFijos(fijos: CostosFijos): number {
  return (fijos.alquiler || 0) + (fijos.electricidad || 0) + (fijos.internet || 0) +
    (fijos.monotributo || 0) + (fijos.herramientas || 0) + (fijos.otros || 0);
}

function totalVariables(v: CostosVariables | undefined | null): number {
  if (!v) return 0;
  return (v.materia_prima || 0) + (v.insumos || 0) + (v.packaging || 0) +
    (v.mano_de_obra || 0) + (v.otros || 0);
}

function calcularCostoFijoAsignado(fijos: CostosFijos, prod: CostoProducto): number {
  const unidades = prod.unidades_mes_estimadas || 1;
  return totalFijos(fijos) / unidades;
}

function calcularCostoTotal(fijos: CostosFijos, prod: CostoProducto): number {
  return totalVariables(prod.variables) + calcularCostoFijoAsignado(fijos, prod);
}

function calcularMargen(fijos: CostosFijos, prod: CostoProducto): number {
  return prod.precio_venta - calcularCostoTotal(fijos, prod);
}

function calcularGananciaJornada(jornada: Jornada, costos: CostosConfig): number {
  return jornada.items.reduce((total, item) => {
    const costoProd = costos.productos.find((c) => c.productoId === item.productoId);
    if (!costoProd) return total;
    const margen = calcularMargen(costos.fijos, costoProd);
    const ganancia = margen * (1 - costos.porcentaje_reinversion / 100);
    return total + ganancia * item.cantidad;
  }, 0);
}

const FIJOS_VACIO: CostosFijos = { alquiler: 0, electricidad: 0, internet: 0, monotributo: 0, herramientas: 0, otros: 0 };
const VARIABLES_VACIO: CostosVariables = { materia_prima: 0, insumos: 0, packaging: 0, mano_de_obra: 0, otros: 0 };

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ViewVentas({ empId, isPro, productos, onUpgrade }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("ventas");
  const [pantalla, setPantalla] = useState<Pantalla>("home");
  const [jornadaActiva, setJornadaActiva] = useState<Jornada | null>(null);
  const [historial, setHistorial] = useState<Jornada[]>([]);
  const [costos, setCostos] = useState<CostosConfig | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    const hoy = new Date().toISOString().split("T")[0];
    const { data: abierta } = await supabase
      .from("ventas_jornadas").select("*").eq("emprendimiento_id", empId)
      .eq("cerrada", false).gte("fecha", hoy).maybeSingle();

    const query = supabase.from("ventas_jornadas").select("*")
      .eq("emprendimiento_id", empId).eq("cerrada", true)
      .order("fecha", { ascending: false });
    if (!isPro) query.limit(5);
    const { data: hist } = await query;

    const { data: costosData } = await supabase.from("ventas_costos")
      .select("*").eq("emprendimiento_id", empId).maybeSingle();

    startTransition(() => {
      setHistorial((hist ?? []) as Jornada[]);
      if (costosData) setCostos(costosData as CostosConfig);
      if (abierta) {
        setJornadaActiva({ ...abierta, items: (abierta.items ?? []) as VentaItem[] });
        setPantalla("registrar");
      }
      setCargando(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId, isPro]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  async function iniciarJornada(canal: string): Promise<void> {
    const hoy = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase.from("ventas_jornadas")
      .insert({ emprendimiento_id: empId, canal: canal.trim(), fecha: hoy, items: [], total: 0, cerrada: false })
      .select().single();
    if (!error && data) { setJornadaActiva({ ...data, items: [] }); setPantalla("registrar"); }
  }

  async function registrarVenta(producto: Producto): Promise<void> {
    if (!jornadaActiva) return;
    const precio = producto.precio_descuento && producto.precio_descuento < producto.precio
      ? producto.precio_descuento : producto.precio;
    const items = [...jornadaActiva.items];
    const idx = items.findIndex((i) => i.productoId === producto.id);
    if (idx >= 0) { items[idx] = { ...items[idx], cantidad: items[idx].cantidad + 1 }; }
    else { items.push({ productoId: producto.id, nombre: producto.nombre, precio, cantidad: 1, imagen: producto.imagen ?? undefined }); }
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    await supabase.from("ventas_jornadas").update({ items, total }).eq("id", jornadaActiva.id);
    setJornadaActiva({ ...jornadaActiva, items, total });
  }

  async function quitarUnidad(productoId: string): Promise<void> {
    if (!jornadaActiva) return;
    const items = jornadaActiva.items
      .map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i)
      .filter((i) => i.cantidad > 0);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    await supabase.from("ventas_jornadas").update({ items, total }).eq("id", jornadaActiva.id);
    setJornadaActiva({ ...jornadaActiva, items, total });
  }

  async function cerrarJornada(): Promise<void> {
    if (!jornadaActiva) return;
    await supabase.from("ventas_jornadas").update({ cerrada: true }).eq("id", jornadaActiva.id);
    setHistorial((prev) => [{ ...jornadaActiva, cerrada: true }, ...prev]);
    setJornadaActiva(null);
    setPantalla("resumen");
  }

  async function guardarCostos(config: CostosConfig): Promise<void> {
    const payload = { ...config, emprendimiento_id: empId };
    if (costos?.id) {
      await supabase.from("ventas_costos").update(payload).eq("id", costos.id);
    } else {
      const { data } = await supabase.from("ventas_costos").insert(payload).select().single();
      if (data) setCostos(data as CostosConfig);
    }
    setCostos(payload);
  }

  function compartirResumen(jornada: Jornada): void {
    const lineas = jornada.items.map((i) => `• ${i.nombre} ×${i.cantidad} = ${formatPeso(i.precio * i.cantidad)}`);
    const gananciaLinea = costos ? `\n💡 Ganancia estimada: ${formatPeso(calcularGananciaJornada(jornada, costos))}` : "";
    const texto = [`🧾 Resumen — ${jornada.canal}`, `📅 ${fechaCorta(jornada.fecha)}`, "", ...lineas, "", `💰 Total: ${formatPeso(jornada.total)}${gananciaLinea}`, "", "Registrado con Viko 📲"].join("\n");
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank");
  }

  if (cargando) return <div style={s.loading}>Cargando...</div>;

  const mostrarTabs = pantalla === "home" || tab === "costos";

  return (
    <div style={s.wrap}>
      {mostrarTabs && (
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "ventas" ? s.tabActive : {}) }} onClick={() => { setTab("ventas"); setPantalla("home"); }}>🧾 Ventas</button>
          <button style={{ ...s.tab, ...(tab === "costos" ? s.tabActive : {}) }} onClick={() => setTab("costos")}>📊 Costos</button>
        </div>
      )}

      {tab === "costos" ? (
        <TabCostos productos={productos.filter((p) => p.activo !== false)} costos={costos} historial={historial} isPro={isPro} onGuardar={guardarCostos} onUpgrade={onUpgrade} formatPeso={formatPeso} />
      ) : (
        <>
          {pantalla === "home" && <PantallaHome historial={historial} costos={costos} isPro={isPro} onHistorial={() => setPantalla("historial")} onUpgrade={onUpgrade} onIniciarConCanal={iniciarJornada} formatPeso={formatPeso} fechaCorta={fechaCorta} />}
          {pantalla === "registrar" && jornadaActiva && <PantallaRegistrar jornada={jornadaActiva} productos={productos.filter((p) => p.activo !== false)} onVender={registrarVenta} onQuitar={quitarUnidad} onCerrar={cerrarJornada} onVolver={() => { setJornadaActiva(null); setPantalla("home"); }} formatPeso={formatPeso} />}
          {pantalla === "resumen" && <PantallaResumen jornada={historial[0] ?? null} costos={costos} onCompartir={() => historial[0] && compartirResumen(historial[0])} onNueva={() => setPantalla("home")} onHistorial={() => setPantalla("historial")} formatPeso={formatPeso} fechaCorta={fechaCorta} />}
          {pantalla === "historial" && <PantallaHistorial historial={historial} costos={costos} isPro={isPro} onCompartir={compartirResumen} onVolver={() => setPantalla("home")} onUpgrade={onUpgrade} formatPeso={formatPeso} fechaCorta={fechaCorta} />}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COSTOS — completo con fijos, variables, costeo real y margen
// ═══════════════════════════════════════════════════════════════════════════════
interface TabCostosProps {
  productos: Producto[];
  costos: CostosConfig | null;
  historial: Jornada[];
  isPro: boolean;
  onGuardar: (c: CostosConfig) => void;
  onUpgrade: () => void;
  formatPeso: (n: number) => string;
}

function NumInput({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void; placeholder?: string;
}) {
  return (
    <div style={s.numInputWrap}>
      <label style={s.numInputLabel}>{label}</label>
      {hint && <p style={s.numInputHint}>{hint}</p>}
      <div style={s.inputWithPrefix}>
        <span style={s.inputPrefix}>$</span>
        <input
          style={s.inputInner}
          type="number"
          min="0"
          placeholder={placeholder ?? "0"}
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

function TabCostos({ productos, costos, historial, isPro, onGuardar, onUpgrade, formatPeso }: TabCostosProps) {
  const [fijos, setFijos] = useState<CostosFijos>(costos?.fijos ?? { ...FIJOS_VACIO });
  const [reinversion, setReinversion] = useState(costos?.porcentaje_reinversion ?? 30);
  const [prodCostos, setProdCostos] = useState<Record<string, { variables: CostosVariables; unidades: number }>>(() => {
    const map: Record<string, { variables: CostosVariables; unidades: number }> = {};
    costos?.productos?.forEach((c) => { map[c.productoId] = { variables: c.variables ?? { ...VARIABLES_VACIO }, unidades: c.unidades_mes_estimadas ?? 1 }; });
    return map;
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [prodExpandido, setProdExpandido] = useState<string | null>(productos[0]?.id ?? null);

  const totalFijosMes = totalFijos(fijos);

  function updateFijo(campo: keyof CostosFijos, valor: number) {
    setFijos((prev) => ({ ...prev, [campo]: valor }));
  }

  function updateVariable(prodId: string, campo: keyof CostosVariables, valor: number) {
    setProdCostos((prev) => ({
      ...prev,
      [prodId]: { ...prev[prodId], variables: { ...(prev[prodId]?.variables ?? { ...VARIABLES_VACIO }), [campo]: valor } },
    }));
  }

  function updateUnidades(prodId: string, valor: number) {
    setProdCostos((prev) => ({ ...prev, [prodId]: { ...prev[prodId], unidades: valor } }));
  }

  async function handleGuardar() {
    setGuardando(true);
    const costosProductos: CostoProducto[] = productos.map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
      precio_venta: p.precio,
      variables: prodCostos[p.id]?.variables ?? { ...VARIABLES_VACIO },
      unidades_mes_estimadas: prodCostos[p.id]?.unidades ?? 1,
    }));
    await onGuardar({ emprendimiento_id: 0, fijos, porcentaje_reinversion: reinversion, productos: costosProductos });
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  // Punto de equilibrio global (promedio de márgenes de contribución)
  const margenesContribucion = productos.map((p) => {
    const pc = prodCostos[p.id];
    if (!pc) return 0;
    const safeVars = pc?.variables ?? { ...VARIABLES_VACIO };
    return p.precio - totalVariables(safeVars); // margen de contribución sin fijos
  }).filter((m) => m > 0);
  const margenContribPromedio = margenesContribucion.length > 0 ? margenesContribucion.reduce((a, b) => a + b, 0) / margenesContribucion.length : 0;
  const puntoEq = totalFijosMes > 0 && margenContribPromedio > 0 ? Math.ceil(totalFijosMes / margenContribPromedio) : null;

  const mesActual = new Date().toISOString().slice(0, 7);
  const unidadesMes = historial.filter((j) => j.fecha.startsWith(mesActual)).reduce((s, j) => s + j.items.reduce((si, i) => si + i.cantidad, 0), 0);

  return (
    <div>
      {/* Intro */}
      <div style={s.descBox}>
        <span style={s.descIcon}>📊</span>
        <p style={s.descText}>
          Acá calculamos el <strong>costo real</strong> de cada producto sumando lo que gastás para producirlo
          (costos variables) más la parte de tus gastos mensuales que le corresponde (costos fijos).
          Con eso sabés exactamente cuánto ganás — o si estás perdiendo plata sin darte cuenta.
        </p>
      </div>

      {/* ── BLOQUE 1: COSTOS FIJOS ─────────────────────────────────────────── */}
      <div style={s.sectionBlock}>
        <div style={s.sectionHeader}>
          <div style={s.sectionIcon}>🏠</div>
          <div>
            <p style={s.sectionTitle}>Costos Fijos Mensuales</p>
            <p style={s.sectionSub}>Lo que pagás todos los meses, vendas mucho o poco.</p>
          </div>
        </div>
        <div style={s.infoBox}>
          <p style={s.infoText}>
            <strong>¿Qué es un costo fijo?</strong> Es un gasto que no cambia según cuánto producís.
            El alquiler, la luz, el internet — los pagás en enero aunque hayas vendido poco,
            y en diciembre aunque hayas vendido muchísimo. Son la base que tu negocio tiene que cubrir sí o sí.
          </p>
        </div>
        <div style={s.fijosGrid}>
          <NumInput label="🏢 Alquiler / uso del espacio" hint="Si trabajás desde casa, calculá un % proporcional de tu alquiler." value={fijos.alquiler} onChange={(v) => updateFijo("alquiler", v)} placeholder="Ej: 90000" />
          <NumInput label="💡 Electricidad general" hint="La luz del mes, no la de la máquina específica (eso va en variables)." value={fijos.electricidad} onChange={(v) => updateFijo("electricidad", v)} placeholder="Ej: 18000" />
          <NumInput label="📱 Internet / teléfono" hint="Conexión a internet, línea de celular, plataformas de gestión." value={fijos.internet} onChange={(v) => updateFijo("internet", v)} placeholder="Ej: 10000" />
          <NumInput label="🧾 Monotributo / impuestos" hint="Lo que pagás de monotributo o cualquier impuesto fijo mensual." value={fijos.monotributo} onChange={(v) => updateFijo("monotributo", v)} placeholder="Ej: 18000" />
          <NumInput label="🔧 Herramientas / mantenimiento" hint="Reparaciones, repuestos, suscripciones a herramientas de trabajo." value={fijos.herramientas} onChange={(v) => updateFijo("herramientas", v)} placeholder="Ej: 12000" />
          <NumInput label="➕ Otros gastos fijos" hint="Cualquier otro gasto mensual que no cambia con la producción." value={fijos.otros} onChange={(v) => updateFijo("otros", v)} placeholder="Ej: 5000" />
        </div>
        <div style={s.totalFijosBox}>
          <span style={s.totalFijosLbl}>Total costos fijos del mes</span>
          <span style={s.totalFijosNum}>{formatPeso(totalFijosMes)}</span>
        </div>
      </div>

      {/* ── BLOQUE 2: COSTOS VARIABLES POR PRODUCTO ────────────────────────── */}
      <div style={s.sectionBlock}>
        <div style={s.sectionHeader}>
          <div style={s.sectionIcon}>📦</div>
          <div>
            <p style={s.sectionTitle}>Costos Variables por Producto</p>
            <p style={s.sectionSub}>Lo que gastás cada vez que producís una unidad.</p>
          </div>
        </div>
        <div style={s.infoBox}>
          <p style={s.infoText}>
            <strong>¿Qué es un costo variable?</strong> Es un gasto que existe solo cuando producís.
            Si no hacés nada, no gastás nada en esto. La materia prima, el packaging, tu tiempo de trabajo —
            todo lo que va directamente en cada unidad que fabricás. A más producción, más gasto variable.
          </p>
        </div>

        {productos.length === 0 && (
          <p style={s.fieldHint}>No tenés productos cargados. Andá a la sección Productos para agregarlos.</p>
        )}

        {productos.map((p) => {
          const pc = prodCostos[p.id] ?? { variables: { ...VARIABLES_VACIO }, unidades: 1 };
          const vars: CostosVariables = pc.variables ?? { ...VARIABLES_VACIO };
          const totalVars = totalVariables(vars);
          const unidades = pc.unidades || 1;
          const costoFijoAsig = totalFijosMes > 0 ? totalFijosMes / unidades : 0;
          const costoTotalUnit = totalVars + costoFijoAsig;
          const margen = p.precio - costoTotalUnit;
          const margenPct = p.precio > 0 ? Math.round((margen / p.precio) * 100) : 0;
          const expandido = prodExpandido === p.id;

          return (
            <div key={p.id} style={s.prodBlock}>
              {/* Header del producto — siempre visible */}
              <button style={s.prodBlockHeader} onClick={() => setProdExpandido(expandido ? null : p.id)}>
                <div style={s.prodBlockLeft}>
                  {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.prodBlockImg} />}
                  <div>
                    <p style={s.prodBlockNombre}>{p.nombre}</p>
                    <p style={s.prodBlockPrecio}>Precio de venta: {formatPeso(p.precio)}</p>
                  </div>
                </div>
                <div style={s.prodBlockRight}>
                  {totalVars > 0 && (
                    <span style={{ ...s.margenPill, background: margen > 0 ? "#e8f5e2" : "#fde8e8", color: margen > 0 ? "#3a6b1e" : "#b91c1c" }}>
                      {margen > 0 ? `+${margenPct}%` : `${margenPct}%`}
                    </span>
                  )}
                  <span style={s.chevron}>{expandido ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Detalle expandible */}
              {expandido && (
                <div style={s.prodBlockBody}>

                  {/* Unidades estimadas — clave para distribuir fijos */}
                  <div style={s.unidadesRow}>
                    <div>
                      <p style={s.numInputLabel}>📅 ¿Cuántas unidades producís por mes?</p>
                      <p style={s.numInputHint}>
                        Con este dato distribuimos los costos fijos entre cada unidad.
                        Si producís 50 al mes y tus fijos son $100.000, le corresponden $2.000 a cada unidad.
                      </p>
                    </div>
                    <input
                      style={{ ...s.inputInner, border: "1px solid #ddd", borderRadius: 8, maxWidth: 80, textAlign: "center" as const }}
                      type="number"
                      min="1"
                      value={unidades || ""}
                      onChange={(e) => updateUnidades(p.id, parseInt(e.target.value) || 1)}
                      placeholder="Ej: 50"
                    />
                  </div>

                  <p style={s.varsTitle}>Costos variables de este producto</p>
                  <div style={s.fijosGrid}>
                    <NumInput
                      label="🌿 Materia prima"
                      hint="Todo lo que va dentro del producto: tela, harina, resina, madera, etc."
                      value={vars.materia_prima}
                      onChange={(v) => updateVariable(p.id, "materia_prima", v)}
                      placeholder="Ej: 800"
                    />
                    <NumInput
                      label="🧴 Insumos complementarios"
                      hint="Materiales secundarios: hilos, pegamento, colorantes, condimentos, etc."
                      value={vars.insumos}
                      onChange={(v) => updateVariable(p.id, "insumos", v)}
                      placeholder="Ej: 120"
                    />
                    <NumInput
                      label="📦 Packaging"
                      hint="Caja, bolsa, etiqueta, cinta, papel de regalo — todo lo que envuelve el producto."
                      value={vars.packaging}
                      onChange={(v) => updateVariable(p.id, "packaging", v)}
                      placeholder="Ej: 200"
                    />
                    <NumInput
                      label="⏱️ Tu tiempo (mano de obra)"
                      hint="El valor de tu tiempo para hacer esta unidad. Calculalo: ¿cuánto querés ganar por hora? Multiplicalo por las horas que tardás."
                      value={vars.mano_de_obra}
                      onChange={(v) => updateVariable(p.id, "mano_de_obra", v)}
                      placeholder="Ej: 1500"
                    />
                    <NumInput
                      label="➕ Otros variables"
                      hint="Transporte, comisión de plataforma, merma de material, productos defectuosos."
                      value={vars.otros}
                      onChange={(v) => updateVariable(p.id, "otros", v)}
                      placeholder="Ej: 300"
                    />
                  </div>

                  {/* Resumen del costeo */}
                  <div style={s.costeoResumen}>
                    <p style={s.costeoTitle}>📋 Resumen del costeo</p>
                    <div style={s.costeoRow}>
                      <span style={s.costeoLbl}>Costo variable unitario</span>
                      <span style={s.costeoVal}>{formatPeso(totalVars)}</span>
                    </div>
                    <div style={s.costeoRow}>
                      <span style={s.costeoLbl}>
                        Costo fijo asignado
                        <span style={s.costeoSub}> ({formatPeso(totalFijosMes)} ÷ {unidades} u.)</span>
                      </span>
                      <span style={s.costeoVal}>{formatPeso(costoFijoAsig)}</span>
                    </div>
                    <div style={{ ...s.costeoRow, borderTop: "2px solid #e0e0d8", paddingTop: 8, marginTop: 4 }}>
                      <span style={{ ...s.costeoLbl, fontWeight: 700, color: "#1a1a1a" }}>Costo total unitario</span>
                      <span style={{ ...s.costeoVal, fontWeight: 700, color: "#1a1a1a" }}>{formatPeso(costoTotalUnit)}</span>
                    </div>
                    <div style={s.costeoRow}>
                      <span style={s.costeoLbl}>Precio de venta</span>
                      <span style={s.costeoVal}>{formatPeso(p.precio)}</span>
                    </div>
                    <div style={{ ...s.costeoRow, background: margen > 0 ? "#e8f5e2" : "#fde8e8", borderRadius: 8, padding: "8px 12px", marginTop: 6 }}>
                      <span style={{ ...s.costeoLbl, fontWeight: 700, color: margen > 0 ? "#3a6b1e" : "#b91c1c" }}>
                        {margen > 0 ? "✅ Margen real por unidad" : "⚠️ Pérdida por unidad"}
                      </span>
                      <span style={{ ...s.costeoVal, fontWeight: 700, color: margen > 0 ? "#3a6b1e" : "#b91c1c" }}>
                        {formatPeso(margen)} ({margenPct}%)
                      </span>
                    </div>
                    {margen <= 0 && (
                      <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 8, lineHeight: 1.5 }}>
                        El precio de venta no alcanza a cubrir todos los costos. Revisá si podés bajar costos o aumentar el precio.
                      </p>
                    )}
                    {margen > 0 && margenPct < 20 && (
                      <p style={{ fontSize: 12, color: "#7a6020", marginTop: 8, lineHeight: 1.5 }}>
                        El margen es positivo pero ajustado. Considerá que parte va a reinversión — asegurate de que la ganancia neta te sirva.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── BLOQUE 3: REINVERSIÓN ──────────────────────────────────────────── */}
      <div style={s.sectionBlock}>
        <div style={s.sectionHeader}>
          <div style={s.sectionIcon}>🔄</div>
          <div>
            <p style={s.sectionTitle}>Reinversión y Ganancia Neta</p>
            <p style={s.sectionSub}>¿Cuánto del margen va al negocio y cuánto es tuyo?</p>
          </div>
        </div>
        <div style={s.infoBox}>
          <p style={s.infoText}>
            <strong>¿Por qué reinvertir?</strong> El margen no es todo ganancia. Parte de ese dinero hay que
            guardarlo para reponer materiales que se pierden, productos que salen defectuosos,
            mejorar herramientas o crecer. La reinversión es lo que le da sustentabilidad al negocio.
            La ganancia neta es lo que efectivamente te llevás a casa.
          </p>
        </div>
        <div style={s.reinversionRow}>
          <div style={{ flex: 1 }}>
            <label style={s.numInputLabel}>% que reinvertís en el negocio</label>
            <p style={s.numInputHint}>De cada $100 de margen, ¿cuántos vuelven al negocio? Lo habitual es entre 20% y 50%.</p>
            <div style={s.inputWithPrefix}>
              <span style={s.inputPrefix}>%</span>
              <input
                style={s.inputInner}
                type="number"
                min="0"
                max="100"
                value={reinversion || ""}
                onChange={(e) => setReinversion(parseFloat(e.target.value) || 0)}
                placeholder="30"
              />
            </div>
          </div>
          <div style={s.reinversionVisual}>
            <div style={{ ...s.reinversionBar, background: "#5a6e45", width: `${reinversion}%` }} />
            <div style={{ ...s.reinversionBar, background: "#e8c840", width: `${100 - reinversion}%` }} />
            <div style={s.reinversionLeyenda}>
              <span style={{ color: "#5a6e45", fontSize: 12 }}>🔄 {reinversion}% negocio</span>
              <span style={{ color: "#7a6020", fontSize: 12 }}>💰 {100 - reinversion}% tuyo</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PUNTO DE EQUILIBRIO ────────────────────────────────────────────── */}
      {puntoEq !== null && (
        <div style={{ ...s.sectionBlock, border: `1px solid ${unidadesMes >= puntoEq ? "#5a6e45" : "#e0a800"}` }}>
          <div style={s.sectionHeader}>
            <div style={s.sectionIcon}>⚖️</div>
            <div>
              <p style={s.sectionTitle}>Punto de Equilibrio</p>
              <p style={s.sectionSub}>¿Cuánto tenés que vender para no perder plata?</p>
            </div>
          </div>
          <div style={s.infoBox}>
            <p style={s.infoText}>
              <strong>¿Qué es el punto de equilibrio?</strong> Es la cantidad mínima de unidades que tenés
              que vender en el mes para cubrir exactamente todos tus costos fijos.
              Por debajo de ese número el negocio pierde dinero. Por encima, empieza la ganancia real.
            </p>
          </div>
          <div style={s.equilibrioGrid}>
            <div style={s.equilibrioCard}>
              <span style={s.equilibrioBig}>{puntoEq}</span>
              <span style={s.equilibrioLbl}>unidades mínimas para cubrir costos</span>
            </div>
            {historial.length > 0 && (
              <div style={{ ...s.equilibrioCard, border: `1px solid ${unidadesMes >= puntoEq ? "#5a6e45" : "#e0a800"}` }}>
                <span style={{ ...s.equilibrioBig, color: unidadesMes >= puntoEq ? "#3a6b1e" : "#a06000" }}>{unidadesMes}</span>
                <span style={s.equilibrioLbl}>unidades vendidas este mes</span>
              </div>
            )}
          </div>
          {historial.length > 0 && (
            <div style={{ ...s.infoBox, background: unidadesMes >= puntoEq ? "#e8f5e2" : "#fffbf0", border: `1px solid ${unidadesMes >= puntoEq ? "#9fcf7a" : "#f5d88e"}` }}>
              <p style={{ ...s.infoText, color: unidadesMes >= puntoEq ? "#3a6b1e" : "#7a6020" }}>
                {unidadesMes >= puntoEq
                  ? `✅ ¡Superaste el punto de equilibrio! Cada unidad adicional que vendas este mes es ganancia pura.`
                  : `⚠️ Te faltan ${puntoEq - unidadesMes} unidades para cubrir tus costos fijos de este mes.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guardar */}
      <button style={{ ...s.btnPrimary, width: "100%", marginTop: 4, opacity: guardando ? 0.7 : 1 }} onClick={handleGuardar} disabled={guardando}>
        {guardando ? "Guardando..." : guardado ? "✓ ¡Guardado!" : "Guardar mis costos"}
      </button>
      <p style={{ ...s.fieldHint, textAlign: "center" as const, marginTop: 8 }}>
        Tus costos quedan guardados en Viko. La próxima vez que abras esta pantalla ya van a estar acá.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME VENTAS
// ═══════════════════════════════════════════════════════════════════════════════
interface HomeProps {
  historial: Jornada[]; costos: CostosConfig | null; isPro: boolean;
  onHistorial: () => void; onUpgrade: () => void;
  onIniciarConCanal: (canal: string) => void;
  formatPeso: (n: number) => string; fechaCorta: (iso: string) => string;
}

function PantallaHome({ historial, costos, isPro, onHistorial, onUpgrade, onIniciarConCanal, formatPeso, fechaCorta }: HomeProps) {
  const [canal, setCanal] = useState("");
  const [canalesGuardados, setCanalesGuardados] = useState<string[]>(getCanalesGuardados);

  function iniciar(c: string): void {
    if (!c.trim()) return;
    const nuevos = [c.trim(), ...canalesGuardados.filter((x) => x !== c.trim())].slice(0, 8);
    localStorage.setItem("viko_canales", JSON.stringify(nuevos));
    setCanalesGuardados(nuevos);
    onIniciarConCanal(c.trim());
  }

  const mesActual = new Date().toISOString().slice(0, 7);
  const totalMes = historial.filter((j) => j.fecha.startsWith(mesActual)).reduce((s, j) => s + j.total, 0);
  const gananciaEstimadaMes = costos ? historial.filter((j) => j.fecha.startsWith(mesActual)).reduce((s, j) => s + calcularGananciaJornada(j, costos), 0) : null;

  return (
    <div>
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Mis Ventas</h2>
        <p style={s.pageSub}>Registrá cada jornada y conocé cómo crece tu negocio.</p>
        <div style={s.descBox}>
          <span style={s.descIcon}>🧾</span>
          <p style={s.descText}>Cada vez que vendés — en una feria, por Instagram, en un evento o puerta a puerta — registrá tus productos con un toque. Con el tiempo vas a saber qué canal te rinde más, qué producto vende mejor y cuánto facturaste en el mes. Todo sin planillas ni papeles.</p>
        </div>
      </div>

      {historial.length > 0 && (
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <span style={s.statNum}>{formatPeso(totalMes)}</span>
            <span style={s.statLbl}>vendido este mes</span>
          </div>
          {gananciaEstimadaMes !== null && (
            <div style={{ ...s.statCard, border: "1px solid #5a6e45" }}>
              <span style={{ ...s.statNum, color: "#3a6b1e" }}>{formatPeso(gananciaEstimadaMes)}</span>
              <span style={s.statLbl}>ganancia estimada</span>
            </div>
          )}
          <div style={s.statCard}>
            <span style={s.statNum}>{historial.length}</span>
            <span style={s.statLbl}>jornadas totales</span>
          </div>
        </div>
      )}

      <div style={s.card}>
        <p style={s.cardTitle}>¿Dónde o cuándo vendés hoy?</p>
        <p style={s.helpText}>Escribí un nombre para identificar esta jornada. Puede ser el lugar (Feria de Palermo), el canal (Instagram, WhatsApp) o la fecha (Sábado 31).</p>
        {canalesGuardados.length > 0 && (
          <div>
            <p style={s.fieldHint}>Tus jornadas anteriores — tocá para usar:</p>
            <div style={s.chipsRow}>
              {canalesGuardados.map((c) => <button key={c} style={s.chip} onClick={() => iniciar(c)}>{c}</button>)}
            </div>
          </div>
        )}
        <div style={s.inputRow}>
          <input style={s.input} placeholder="Ej: Feria de Palermo, Sábado 31, Instagram..." value={canal} onChange={(e) => setCanal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && iniciar(canal)} maxLength={60} />
          <button style={{ ...s.btnPrimary, opacity: canal.trim() ? 1 : 0.5 }} onClick={() => iniciar(canal)} disabled={!canal.trim()}>Iniciar →</button>
        </div>
      </div>

      {historial.length > 0 && (
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ ...s.cardTitle, marginBottom: 0 }}>Últimas jornadas</p>
            <button style={s.btnLink} onClick={onHistorial}>Ver todas →</button>
          </div>
          {historial.slice(0, 3).map((j) => {
            const ganancia = costos ? calcularGananciaJornada(j, costos) : null;
            return (
              <div key={j.id} style={s.jornadaRow}>
                <div>
                  <p style={s.jornadaNombre}>{j.canal}</p>
                  <p style={s.jornadaFecha}>{fechaCorta(j.fecha)} · {j.items.length} productos</p>
                  {ganancia !== null && <p style={{ ...s.jornadaFecha, color: "#3a6b1e" }}>Ganancia est.: {formatPeso(ganancia)}</p>}
                </div>
                <p style={s.jornadaTotal}>{formatPeso(j.total)}</p>
              </div>
            );
          })}
          {!isPro && <div style={s.proGate}><p style={s.proGateText}>Historial completo y analytics por canal disponibles en Pro</p><button style={s.btnPro} onClick={onUpgrade}>Ver planes ⚡</button></div>}
        </div>
      )}

      {historial.length === 0 && (
        <div style={s.emptyState}>
          <p style={s.emptyIcon}>🧾</p>
          <p style={s.emptyTitle}>Todavía no registraste ninguna venta</p>
          <p style={s.emptySub}>Iniciá tu primera jornada arriba. No necesitás saber de tecnología — es tan simple como escribir dónde estás vendiendo y tocar cada producto que vendés.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRAR
// ═══════════════════════════════════════════════════════════════════════════════
interface RegistrarProps {
  jornada: Jornada; productos: Producto[];
  onVender: (p: Producto) => void; onQuitar: (id: string) => void;
  onCerrar: () => void; onVolver: () => void;
  formatPeso: (n: number) => string;
}

function PantallaRegistrar({ jornada, productos, onVender, onQuitar, onCerrar, onVolver, formatPeso }: RegistrarProps) {
  const [busqueda, setBusqueda] = useState("");
  const totalHoy = jornada.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const prodsFiltrados = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div>
      <div style={s.jornadaHeader}>
        <div>
          <p style={s.jornadaHeaderCanal}>{jornada.canal}</p>
          <p style={s.jornadaHeaderSub}>Tocá un producto cada vez que vendés uno</p>
        </div>
        <div style={s.totalBig}>{formatPeso(totalHoy)}</div>
      </div>
      <div style={s.descBox}>
        <span style={s.descIcon}>👆</span>
        <p style={s.descText}>Cada toque suma una unidad vendida. Para descontar una venta equivocada, tocá el <strong>−</strong> en el producto.</p>
      </div>
      {productos.length > 5 && <input style={{ ...s.input, marginBottom: 12 }} placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />}
      <div style={s.productosGrid}>
        {prodsFiltrados.map((p) => {
          const cant = jornada.items.find((i) => i.productoId === p.id)?.cantidad ?? 0;
          const precio = p.precio_descuento && p.precio_descuento < p.precio ? p.precio_descuento : p.precio;
          return (
            <div key={p.id} style={{ ...s.productoCelda, ...(cant > 0 ? s.productoCeldaActiva : {}) }} onClick={() => onVender(p)}>
              {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.productoImg} />}
              <p style={s.productoNombre}>{p.nombre}</p>
              <p style={s.productoPrecio}>{formatPeso(precio)}</p>
              {cant > 0 && (
                <div style={s.cantBadge}>
                  <button style={s.cantBtn} onClick={(e) => { e.stopPropagation(); onQuitar(p.id); }}>−</button>
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
              <span style={s.itemTotal}>{formatPeso(item.precio * item.cantidad)}</span>
            </div>
          ))}
          <div style={s.itemTotalRow}>
            <span style={s.itemTotalLbl}>Total del día</span>
            <span style={s.itemTotalNum}>{formatPeso(totalHoy)}</span>
          </div>
        </div>
      )}
      <div style={s.accionesRow}>
        <button style={s.btnSecondary} onClick={onVolver}>← Volver</button>
        <button style={{ ...s.btnPrimary, opacity: jornada.items.length > 0 ? 1 : 0.5 }} onClick={onCerrar} disabled={jornada.items.length === 0}>Cerrar jornada ✓</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════════════════════
interface ResumenProps {
  jornada: Jornada | null; costos: CostosConfig | null;
  onCompartir: () => void; onNueva: () => void; onHistorial: () => void;
  formatPeso: (n: number) => string; fechaCorta: (iso: string) => string;
}

function PantallaResumen({ jornada, costos, onCompartir, onNueva, onHistorial, formatPeso, fechaCorta }: ResumenProps) {
  if (!jornada) return <div style={s.wrap}><button style={s.btnLink} onClick={onNueva}>← Volver</button></div>;
  const ganancia = costos ? calcularGananciaJornada(jornada, costos) : null;
  return (
    <div>
      <div style={s.resumenHero}>
        <p style={s.resumenIcon}>✅</p>
        <p style={s.resumenTitulo}>¡Jornada cerrada!</p>
        <p style={s.resumenCanal}>{jornada.canal} · {fechaCorta(jornada.fecha)}</p>
        <p style={s.resumenTotal}>{formatPeso(jornada.total)}</p>
        {ganancia !== null && <p style={{ fontSize: 15, color: "#3a6b1e", fontWeight: 600, margin: "4px 0 0" }}>Ganancia estimada: {formatPeso(ganancia)}</p>}
      </div>
      <div style={s.card}>
        <p style={s.cardTitle}>Detalle de la jornada</p>
        {jornada.items.map((item) => (
          <div key={item.productoId} style={s.itemRow}>
            <span style={s.itemNombre}>{item.nombre}</span>
            <span style={s.itemCant}>×{item.cantidad}</span>
            <span style={s.itemTotal}>{formatPeso(item.precio * item.cantidad)}</span>
          </div>
        ))}
        {!costos && <p style={{ ...s.fieldHint, marginTop: 12 }}>💡 Cargá tus costos en la pestaña <strong>Costos</strong> para ver cuánto ganaste en cada jornada.</p>}
      </div>
      <div style={s.accionesCol}>
        <button style={s.btnWA} onClick={onCompartir}>💬 Compartir resumen por WhatsApp</button>
        <button style={s.btnPrimary} onClick={onNueva}>+ Nueva jornada</button>
        <button style={s.btnLink} onClick={onHistorial}>Ver historial completo →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORIAL
// ═══════════════════════════════════════════════════════════════════════════════
interface HistorialProps {
  historial: Jornada[]; costos: CostosConfig | null; isPro: boolean;
  onCompartir: (j: Jornada) => void; onVolver: () => void; onUpgrade: () => void;
  formatPeso: (n: number) => string; fechaCorta: (iso: string) => string;
}

function PantallaHistorial({ historial, costos, isPro, onCompartir, onVolver, onUpgrade, formatPeso, fechaCorta }: HistorialProps) {
  const canales = [...new Set(historial.map((j) => j.canal))];
  const mejorCanal = canales.map((canal) => {
    const jornadas = historial.filter((j) => j.canal === canal);
    const total = jornadas.reduce((s, j) => s + j.total, 0);
    return { canal, total, promedio: total / jornadas.length, jornadas: jornadas.length };
  }).sort((a, b) => b.total - a.total);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button style={s.btnLink} onClick={onVolver}>← Volver</button>
        <h2 style={{ ...s.pageTitle, margin: 0 }}>Historial</h2>
      </div>
      {isPro && canales.length > 1 && (
        <div style={s.card}>
          <p style={s.cardTitle}>Por canal de venta</p>
          <p style={s.helpText}>Cuánto vendiste en total en cada lugar o canal, del mejor al menor.</p>
          {mejorCanal.map((c) => (
            <div key={c.canal} style={s.jornadaRow}>
              <div>
                <p style={s.jornadaNombre}>{c.canal}</p>
                <p style={s.jornadaFecha}>{c.jornadas} jornadas · promedio {formatPeso(Math.round(c.promedio))}</p>
              </div>
              <p style={s.jornadaTotal}>{formatPeso(c.total)}</p>
            </div>
          ))}
        </div>
      )}
      {!isPro && <div style={s.proGate}><p style={s.proGateText}>📊 Comparativa por canal disponible en Pro</p><button style={s.btnPro} onClick={onUpgrade}>Ver planes ⚡</button></div>}
      <div style={s.card}>
        <p style={s.cardTitle}>Todas las jornadas</p>
        {historial.map((j) => {
          const ganancia = costos ? calcularGananciaJornada(j, costos) : null;
          return (
            <div key={j.id} style={s.jornadaRow}>
              <div>
                <p style={s.jornadaNombre}>{j.canal}</p>
                <p style={s.jornadaFecha}>{fechaCorta(j.fecha)} · {j.items.length} productos</p>
                {ganancia !== null && <p style={{ ...s.jornadaFecha, color: "#3a6b1e" }}>Ganancia est.: {formatPeso(ganancia)}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <p style={s.jornadaTotal}>{formatPeso(j.total)}</p>
                <button style={s.btnIconSmall} onClick={() => onCompartir(j)} title="Compartir">💬</button>
              </div>
            </div>
          );
        })}
        {!isPro && historial.length >= 5 && <p style={{ fontSize: 12, color: "#999", textAlign: "center" as const, marginTop: 12 }}>Mostrando las últimas 5. Actualizá a Pro para ver el historial completo.</p>}
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap:               { padding: "0 0 40px", maxWidth: 680, margin: "0 auto" },
  loading:            { padding: 40, textAlign: "center", color: "#888" },
  tabs:               { display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #eee" },
  tab:                { flex: 1, background: "none", border: "none", padding: "12px 16px", fontSize: 14, fontWeight: 500, color: "#888", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -2 },
  tabActive:          { color: "#5a6e45", borderBottom: "2px solid #5a6e45", fontWeight: 700 },
  pageHeader:         { marginBottom: 20 },
  pageTitle:          { fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#1a1a1a" },
  pageSub:            { fontSize: 14, color: "#666", margin: 0 },
  descBox:            { display: "flex", gap: 10, alignItems: "flex-start", background: "#f8f8f5", border: "1px solid #eee", borderRadius: 10, padding: "12px 14px", marginTop: 10, marginBottom: 4 },
  descIcon:           { fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 },
  descText:           { fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 },
  helpText:           { fontSize: 13, color: "#777", margin: "0 0 12px", lineHeight: 1.6 },
  fieldHint:          { fontSize: 12, color: "#999", margin: "6px 0 0", lineHeight: 1.5 },
  // Secciones de costos
  sectionBlock:       { background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "20px", marginBottom: 16 },
  sectionHeader:      { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 },
  sectionIcon:        { fontSize: 24, lineHeight: 1, flexShrink: 0 },
  sectionTitle:       { fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 2px" },
  sectionSub:         { fontSize: 13, color: "#888", margin: 0 },
  infoBox:            { background: "#f8f8f5", borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: "1px solid #ebebeb" },
  infoText:           { fontSize: 13, color: "#555", margin: 0, lineHeight: 1.65 },
  fijosGrid:          { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 14 },
  numInputWrap:       { display: "flex", flexDirection: "column" as const, gap: 4 },
  numInputLabel:      { fontSize: 13, fontWeight: 600, color: "#333", margin: 0 },
  numInputHint:       { fontSize: 11, color: "#999", margin: 0, lineHeight: 1.4 },
  totalFijosBox:      { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a1a", borderRadius: 10, padding: "12px 16px" },
  totalFijosLbl:      { fontSize: 13, color: "#ccc", fontWeight: 500 },
  totalFijosNum:      { fontSize: 18, color: "#fff", fontWeight: 800 },
  // Productos en costos
  prodBlock:          { border: "1px solid #eee", borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  prodBlockHeader:    { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const },
  prodBlockLeft:      { display: "flex", gap: 12, alignItems: "center" },
  prodBlockImg:       { width: 40, height: 40, objectFit: "cover" as const, borderRadius: 8, flexShrink: 0 },
  prodBlockNombre:    { fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0 },
  prodBlockPrecio:    { fontSize: 12, color: "#888", margin: "2px 0 0" },
  prodBlockRight:     { display: "flex", alignItems: "center", gap: 10 },
  margenPill:         { fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  chevron:            { fontSize: 12, color: "#aaa" },
  prodBlockBody:      { padding: "0 16px 16px", borderTop: "1px solid #f0f0ec" },
  unidadesRow:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "14px 0", borderBottom: "1px solid #f0f0ec", marginBottom: 14 },
  varsTitle:          { fontSize: 13, fontWeight: 600, color: "#444", margin: "0 0 12px" },
  costeoResumen:      { background: "#f8f8f5", borderRadius: 12, padding: "14px 16px", marginTop: 16 },
  costeoTitle:        { fontSize: 13, fontWeight: 600, color: "#444", margin: "0 0 10px" },
  costeoRow:          { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid #ebebeb" },
  costeoLbl:          { fontSize: 13, color: "#555" },
  costeoSub:          { fontSize: 11, color: "#aaa" },
  costeoVal:          { fontSize: 13, color: "#333" },
  // Reinversión
  reinversionRow:     { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" as const },
  reinversionVisual:  { flex: 1, minWidth: 140, marginTop: 24 },
  reinversionBar:     { height: 12, display: "inline-block", borderRadius: 4, transition: "width .3s" },
  reinversionLeyenda: { display: "flex", justifyContent: "space-between", marginTop: 6 },
  // Punto de equilibrio
  equilibrioGrid:     { display: "flex", gap: 12, flexWrap: "wrap" as const, margin: "12px 0" },
  equilibrioCard:     { flex: 1, minWidth: 120, background: "#f8f8f5", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 4 },
  equilibrioBig:      { fontSize: 28, fontWeight: 800, color: "#1a1a1a" },
  equilibrioLbl:      { fontSize: 12, color: "#888" },
  // Comunes
  card:               { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "18px", marginBottom: 14 },
  cardTitle:          { fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px" },
  statsRow:           { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const },
  statCard:           { flex: 1, minWidth: 100, background: "#f8f8f5", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 3, border: "1px solid #eee" },
  statNum:            { fontSize: 18, fontWeight: 700, color: "#1a1a1a" },
  statLbl:            { fontSize: 11, color: "#888" },
  chipsRow:           { display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 12 },
  chip:               { background: "#f0f0ec", border: "1px solid #e0e0d8", borderRadius: 20, padding: "5px 12px", fontSize: 13, color: "#444", cursor: "pointer" },
  inputRow:           { display: "flex", gap: 10, flexWrap: "wrap" as const },
  input:              { flex: 1, minWidth: 180, border: "1px solid #ddd", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", color: "#1a1a1a", background: "#fff" },
  inputWithPrefix:    { display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 10, overflow: "hidden", background: "#fff" },
  inputPrefix:        { padding: "10px 12px", background: "#f8f8f5", fontSize: 14, color: "#888", borderRight: "1px solid #ddd", flexShrink: 0 },
  inputInner:         { flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: 14, color: "#1a1a1a", background: "transparent" },
  btnPrimary:         { background: "#5a6e45", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const },
  btnSecondary:       { background: "#f0f0ec", color: "#444", border: "1px solid #ddd", borderRadius: 10, padding: "10px 16px", fontSize: 14, cursor: "pointer" },
  btnLink:            { background: "none", border: "none", color: "#5a6e45", fontSize: 13, cursor: "pointer", fontWeight: 600, padding: 0 },
  btnWA:              { background: "#25d366", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" },
  btnPro:             { background: "#f5a623", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnIconSmall:       { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 4px" },
  jornadaHeader:      { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f8f5", borderRadius: 14, padding: "16px 18px", marginBottom: 12 },
  jornadaHeaderCanal: { fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 },
  jornadaHeaderSub:   { fontSize: 12, color: "#888", margin: "4px 0 0" },
  totalBig:           { fontSize: 22, fontWeight: 700, color: "#5a6e45" },
  productosGrid:      { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 8 },
  productoCelda:      { background: "#fff", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 10px", cursor: "pointer", textAlign: "center" as const, position: "relative" as const },
  productoCeldaActiva:{ border: "1.5px solid #5a6e45", background: "#f6f9f3" },
  productoImg:        { width: "100%", height: 64, objectFit: "cover" as const, borderRadius: 8, marginBottom: 8, display: "block" },
  productoNombre:     { fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px", lineHeight: 1.3 },
  productoPrecio:     { fontSize: 13, color: "#5a6e45", fontWeight: 700, margin: 0 },
  cantBadge:          { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, background: "#5a6e45", borderRadius: 8, padding: "4px 8px" },
  cantBtn:            { color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", lineHeight: 1, background: "none", border: "none" },
  cantNum:            { color: "#fff", fontSize: 14, fontWeight: 700 },
  itemRow:            { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0f0ec" },
  itemNombre:         { flex: 1, fontSize: 13, color: "#1a1a1a", margin: 0 },
  itemCant:           { fontSize: 13, color: "#888", margin: 0, minWidth: 28, textAlign: "center" as const },
  itemTotal:          { fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0, minWidth: 80, textAlign: "right" as const },
  itemTotalRow:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "2px solid #eee" },
  itemTotalLbl:       { fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  itemTotalNum:       { fontSize: 18, fontWeight: 700, color: "#5a6e45" },
  accionesRow:        { display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" },
  accionesCol:        { display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 20 },
  resumenHero:        { textAlign: "center" as const, padding: "32px 20px 24px" },
  resumenIcon:        { fontSize: 40, margin: "0 0 12px" },
  resumenTitulo:      { fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" },
  resumenCanal:       { fontSize: 14, color: "#888", margin: "0 0 12px" },
  resumenTotal:       { fontSize: 32, fontWeight: 800, color: "#5a6e45", margin: 0 },
  jornadaRow:         { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ec" },
  jornadaNombre:      { fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: 0 },
  jornadaFecha:       { fontSize: 12, color: "#888", margin: "2px 0 0" },
  jornadaTotal:       { fontSize: 15, fontWeight: 700, color: "#5a6e45", margin: 0 },
  proGate:            { background: "#fffbf0", border: "1px solid #f5d88e", borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const },
  proGateText:        { fontSize: 13, color: "#7a6020", margin: 0, flex: 1 },
  emptyState:         { textAlign: "center" as const, padding: "48px 20px" },
  emptyIcon:          { fontSize: 40, margin: "0 0 16px" },
  emptyTitle:         { fontSize: 16, fontWeight: 600, color: "#444", margin: "0 0 8px" },
  emptySub:           { fontSize: 14, color: "#888", margin: 0, lineHeight: 1.5 },
};