"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";
import MpBanner from "./MpBanner";
import {
  LAYOUTS,
  COLORES,
  parsePlantilla,
  PlantillaConfig,
} from "../../lib/plantillas";

interface Variante {
  tipo: string;
  opciones: string[];
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  categoria?: string;
  imagen?: string;
  variantes?: Variante[];
  activo?: boolean;
  emprendimiento_id?: number;
}

interface ViewProductosProps {
  empId: number;
  userId: string;
  isPro: boolean;
  mpConnected: boolean;
  empNombre: string;
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  plantilla?: unknown;
  onPlantillaChange?: (p: PlantillaConfig) => void;
}

const LIMITE_FREE = 3;

export default function ViewProductos({
  empId,
  userId,
  isPro,
  mpConnected,
  empNombre,
  productos,
  setProductos,
  plantilla,
  onPlantillaChange,
}: ViewProductosProps) {
  const config = parsePlantilla(plantilla);
  const accentColor = COLORES[config.color]?.accent ?? "#6B7A5A";

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [tab, setTab] = useState<"productos" | "plantilla">("productos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProd, setEditProd] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    imagen: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [newProd, setNewProd] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    imagen: "",
    variantes: [] as Variante[],
  });
  const [nuevaVarianteTipo, setNuevaVarianteTipo] = useState("");
  const [nuevaVarianteOpciones, setNuevaVarianteOpciones] = useState("");

  const supabase = createClient();
  const limiteAlcanzado = !isPro && productos.length >= LIMITE_FREE;

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodo: "mensual" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleSelectPlantilla(next: Partial<PlantillaConfig>) {
    const updated: PlantillaConfig = { ...config, ...next };
    onPlantillaChange?.(updated);
    await supabase
      .from("emprendimientos")
      .update({ plantilla: updated })
      .eq("id", empId);
  }

  async function handleImageUpload(file: File) {
    setUploadingImg(true);
    try {
      const ext = file.name.split(".").pop();
      const ts = new Date().getTime();
      const path = `${userId}/${empId}/${ts}.${ext}`;
      const { error } = await supabase.storage
        .from("productos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("productos").getPublicUrl(path);
      setNewProd((prev) => ({ ...prev, imagen: data.publicUrl }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleEditImageUpload(file: File) {
    const ext = file.name.split(".").pop();
    const ts = new Date().getTime();
    const path = `${userId}/${empId}/${ts}.${ext}`;
    const { error } = await supabase.storage
      .from("productos")
      .upload(path, file, { upsert: true });
    if (error) return;
    const { data } = supabase.storage.from("productos").getPublicUrl(path);
    setEditProd((prev) => ({ ...prev, imagen: data.publicUrl }));
  }

  function agregarVariante() {
    if (!nuevaVarianteTipo.trim() || !nuevaVarianteOpciones.trim()) return;
    const opciones = nuevaVarianteOpciones
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    setNewProd((prev) => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        { tipo: nuevaVarianteTipo.trim(), opciones },
      ],
    }));
    setNuevaVarianteTipo("");
    setNuevaVarianteOpciones("");
  }

  function quitarVariante(index: number) {
    setNewProd((prev) => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index),
    }));
  }

  function startEdit(p: Producto) {
    setEditingId(p.id);
    setEditProd({
      nombre: p.nombre,
      precio: String(p.precio),
      descripcion: p.descripcion ?? "",
      imagen: p.imagen ?? "",
    });
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (limiteAlcanzado) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("productos")
      .insert({
        nombre: newProd.nombre,
        descripcion: newProd.descripcion,
        precio: parseFloat(newProd.precio),
        categoria: newProd.categoria,
        imagen: newProd.imagen,
        variantes: newProd.variantes,
        emprendimiento_id: empId,
        activo: true,
      })
      .select()
      .single();
    if (!error && data) {
      setProductos((prev) => [data, ...prev]);
      setNewProd({
        nombre: "",
        descripcion: "",
        precio: "",
        categoria: "",
        imagen: "",
        variantes: [],
      });
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleSaveEdit(id: string) {
    setSavingEdit(true);
    const { data, error } = await supabase
      .from("productos")
      .update({
        nombre: editProd.nombre,
        precio: parseFloat(editProd.precio),
        descripcion: editProd.descripcion,
        imagen: editProd.imagen,
      })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p)),
      );
      setEditingId(null);
    }
    setSavingEdit(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("productos").delete().eq("id", id);
    setProductos((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleActivo(id: string, activo: boolean) {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id);
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, activo: !activo } : p)),
    );
  }

  return (
    <div className={styles.view}>
      <section className={styles.section}>
        {isPro && <MpBanner mpConnected={mpConnected} empNombre={empNombre} />}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: "var(--cream)",
            borderRadius: 12,
            padding: 4,
          }}
        >
          {[
            { id: "productos", label: "🛍️ Productos" },
            { id: "plantilla", label: "🎨 Diseño de tienda" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as "productos" | "plantilla")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 9,
                border: "none",
                background: tab === t.id ? "#fff" : "transparent",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: tab === t.id ? "var(--black)" : "var(--muted)",
                cursor: "pointer",
                boxShadow:
                  tab === t.id ? "0 1px 4px rgba(26,24,20,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB DISEÑO ── */}
        {tab === "plantilla" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h4
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--black)",
                  marginBottom: 4,
                }}
              >
                Layout
              </h4>
              <p className={styles.sectionSub} style={{ marginBottom: 16 }}>
                Elegí cómo se organiza el contenido de tu tienda.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                {LAYOUTS.map((l) => {
                  const sel = config.layout === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleSelectPlantilla({ layout: l.id })}
                      style={{
                        border: sel
                          ? `2px solid ${accentColor}`
                          : "2px solid var(--border)",
                        borderRadius: 14,
                        padding: 0,
                        cursor: "pointer",
                        background: "transparent",
                        overflow: "hidden",
                        boxShadow: sel ? `0 0 0 3px ${accentColor}25` : "none",
                        transition: "all 0.18s",
                      }}
                    >
                      <div
                        style={{
                          height: 64,
                          background: sel ? accentColor + "15" : "var(--cream)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                        }}
                      >
                        {l.emoji}
                      </div>
                      <div
                        style={{
                          padding: "8px 10px",
                          background: "#fff",
                          textAlign: "left",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--black)",
                            marginBottom: 2,
                          }}
                        >
                          {l.label}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            lineHeight: 1.3,
                          }}
                        >
                          {l.desc}
                        </p>
                      </div>
                      {sel && (
                        <div
                          style={{
                            background: accentColor,
                            padding: "3px 0",
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#fff",
                          }}
                        >
                          ✓ ACTIVO
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--black)",
                  marginBottom: 4,
                }}
              >
                Color principal
              </h4>
              <p className={styles.sectionSub} style={{ marginBottom: 16 }}>
                Define la identidad visual de tu tienda.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 10,
                }}
              >
                {Object.entries(COLORES).map(([key, c]) => {
                  const sel = config.color === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPlantilla({ color: key })}
                      title={c.label}
                      style={{
                        border: sel
                          ? `3px solid ${c.accent}`
                          : "3px solid transparent",
                        borderRadius: 12,
                        padding: 0,
                        cursor: "pointer",
                        background: "transparent",
                        overflow: "hidden",
                        boxShadow: sel
                          ? `0 0 0 2px ${c.accent}`
                          : "0 1px 4px rgba(0,0,0,0.1)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          height: 40,
                          background: c.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: c.accent,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "4px 2px",
                          background: "#fff",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: "var(--muted)",
                            lineHeight: 1.2,
                          }}
                        >
                          {c.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                background: "var(--cream)",
                borderRadius: 12,
                padding: "14px 16px",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--black)",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ color: accentColor }}>
                    {LAYOUTS.find((l) => l.id === config.layout)?.label}
                  </span>
                  {" · "}
                  <span style={{ color: accentColor }}>
                    {COLORES[config.color]?.label}
                  </span>
                </p>
                <p style={{ fontSize: 11, color: "var(--muted)" }}>
                  Los cambios se guardan automáticamente
                </p>
              </div>
              <a
                href={`/emprendimiento/${slugify(empNombre)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: accentColor,
                  color: "#fff",
                  borderRadius: 100,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Ver tienda →
              </a>
            </div>
          </div>
        )}

        {/* ── TAB PRODUCTOS ── */}
        {tab === "productos" && (
          <>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Catálogo de productos</h3>
                {!isPro && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    Plan Free: {productos.length}/{LIMITE_FREE} productos
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    background: "var(--cream)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setVistaGrid(false)}
                    style={{
                      padding: "6px 10px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      background: !vistaGrid ? "var(--olive)" : "transparent",
                      color: !vistaGrid ? "#fff" : "var(--muted)",
                    }}
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaGrid(true)}
                    style={{
                      padding: "6px 10px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      background: vistaGrid ? "var(--olive)" : "transparent",
                      color: vistaGrid ? "#fff" : "var(--muted)",
                    }}
                  >
                    ⊞
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: "8px 18px",
                    fontSize: "13px",
                    opacity: limiteAlcanzado ? 0.4 : 1,
                  }}
                  onClick={() => !limiteAlcanzado && setAdding(!adding)}
                  disabled={limiteAlcanzado}
                >
                  {adding ? "Cancelar" : "+ Agregar producto"}
                </button>
              </div>
            </div>

            {limiteAlcanzado && (
              <div
                style={{
                  background: "linear-gradient(135deg, #1A1814, #2D2B26)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  border: "1px solid rgba(201,168,76,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#C9A84C",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    Límite del plan Free alcanzado
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Activá Pro para productos ilimitados, carrito y MercadoPago.
                  </p>
                </div>
                <button
                  onClick={handleUpgrade}
                  style={{
                    background: "#C9A84C",
                    border: "none",
                    borderRadius: 100,
                    padding: "10px 22px",
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#1A1814",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  ⚡ Activar Pro — $9.900/mes
                </button>
              </div>
            )}

            {adding && !limiteAlcanzado && (
              <form onSubmit={handleAddProduct} className={styles.addForm}>
                <div className={styles.field}>
                  <label className="field-label">Foto del producto</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    {newProd.imagen ? (
                      <div
                        style={{
                          position: "relative",
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={newProd.imagen}
                          alt="Preview"
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="80px"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewProd((prev) => ({ ...prev, imagen: "" }))
                          }
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "rgba(26,24,20,0.7)",
                            border: "none",
                            color: "#FAFAF7",
                            fontSize: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          border: "1.5px dashed var(--border-strong)",
                          background: "var(--cream)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          fontSize: 11,
                          color: "var(--muted)",
                        }}
                      >
                        {uploadingImg ? (
                          "..."
                        ) : (
                          <>
                            <span style={{ fontSize: 24 }}>📷</span>
                            <span>Subir foto</span>
                          </>
                        )}
                      </button>
                    )}
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      Recomendado: imagen cuadrada, fondo blanco o neutro.
                    </p>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className="field-label">Nombre del producto</label>
                    <input
                      className="input-field"
                      value={newProd.nombre}
                      onChange={(e) =>
                        setNewProd((p) => ({ ...p, nombre: e.target.value }))
                      }
                      placeholder="Ej: Remera básica"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className="field-label">Precio (ARS)</label>
                    <input
                      className="input-field"
                      type="number"
                      value={newProd.precio}
                      onChange={(e) =>
                        setNewProd((p) => ({ ...p, precio: e.target.value }))
                      }
                      placeholder="15000"
                      required
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className="field-label">Descripción (opcional)</label>
                  <input
                    className="input-field"
                    value={newProd.descripcion}
                    onChange={(e) =>
                      setNewProd((p) => ({ ...p, descripcion: e.target.value }))
                    }
                    placeholder="Breve descripción del producto"
                  />
                </div>
                <div className={styles.field}>
                  <label className="field-label">Variantes (opcional)</label>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 10,
                    }}
                  >
                    Ej: tipo &quot;Color&quot;, opciones &quot;Rojo, Azul,
                    Negro&quot;
                  </p>
                  {newProd.variantes.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {newProd.variantes.map((v, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 14px",
                            background: "var(--cream)",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700 }}>
                            {v.tipo}:
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                              flex: 1,
                            }}
                          >
                            {v.opciones.join(", ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarVariante(i)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--terracota)",
                              fontSize: 14,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
                  >
                    <div style={{ flex: 1 }}>
                      <label className="field-label" style={{ fontSize: 10 }}>
                        Tipo
                      </label>
                      <input
                        className="input-field"
                        value={nuevaVarianteTipo}
                        onChange={(e) => setNuevaVarianteTipo(e.target.value)}
                        placeholder="Color / Talle..."
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label className="field-label" style={{ fontSize: 10 }}>
                        Opciones (separadas por coma)
                      </label>
                      <input
                        className="input-field"
                        value={nuevaVarianteOpciones}
                        onChange={(e) =>
                          setNuevaVarianteOpciones(e.target.value)
                        }
                        placeholder="Rojo, Azul, Negro"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={agregarVariante}
                      className="btn btn-olive"
                      style={{
                        padding: "10px 16px",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "11px 28px", fontSize: "13px" }}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar producto"}
                </button>
              </form>
            )}

            {productos.length === 0 && !adding ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🛍️</span>
                <p className={styles.emptyTitle}>
                  Todavía no agregaste productos
                </p>
                <p className={styles.emptySub}>
                  Agregá tu catálogo con fotos, precios y variantes.
                </p>
              </div>
            ) : vistaGrid ? (
              /* ── GRID ── */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleEditImageUpload(f);
                  }}
                />
                {productos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "var(--cream)",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      opacity: p.activo === false ? 0.5 : 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1",
                        background: "var(--white)",
                      }}
                    >
                      {editingId === p.id && editProd.imagen ? (
                        <Image
                          src={editProd.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="160px"
                        />
                      ) : p.imagen ? (
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="160px"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 32,
                          }}
                        >
                          🛍️
                        </div>
                      )}
                    </div>

                    {editingId === p.id ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <input
                          className="input-field"
                          value={editProd.nombre}
                          onChange={(e) =>
                            setEditProd((p) => ({
                              ...p,
                              nombre: e.target.value,
                            }))
                          }
                          placeholder="Nombre"
                          style={{ fontSize: 12, padding: "6px 10px" }}
                        />
                        <input
                          className="input-field"
                          type="number"
                          value={editProd.precio}
                          onChange={(e) =>
                            setEditProd((p) => ({
                              ...p,
                              precio: e.target.value,
                            }))
                          }
                          placeholder="Precio"
                          style={{ fontSize: 12, padding: "6px 10px" }}
                        />
                        <input
                          className="input-field"
                          value={editProd.descripcion}
                          onChange={(e) =>
                            setEditProd((p) => ({
                              ...p,
                              descripcion: e.target.value,
                            }))
                          }
                          placeholder="Descripción"
                          style={{ fontSize: 12, padding: "6px 10px" }}
                        />
                        <button
                          type="button"
                          onClick={() => editFileRef.current?.click()}
                          style={{
                            fontSize: 11,
                            color: "var(--olive)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            padding: 0,
                          }}
                        >
                          📷 Cambiar foto
                        </button>
                        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            disabled={savingEdit}
                            style={{
                              flex: 1,
                              padding: "6px",
                              borderRadius: 8,
                              border: "none",
                              background: "var(--olive)",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {savingEdit ? "..." : "Guardar"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              background: "transparent",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "10px 12px", flex: 1 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--black)",
                            marginBottom: 2,
                          }}
                        >
                          {p.nombre}
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--olive-dark)",
                          }}
                        >
                          ${Number(p.precio).toLocaleString("es-AR")}
                        </p>
                      </div>
                    )}

                    {editingId !== p.id && (
                      <div
                        style={{
                          padding: "8px 12px",
                          display: "flex",
                          gap: 6,
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <button
                          onClick={() => startEdit(p)}
                          style={{
                            flex: 1,
                            padding: "4px 0",
                            borderRadius: 100,
                            fontSize: 10,
                            fontWeight: 600,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "var(--muted)",
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => toggleActivo(p.id, p.activo ?? true)}
                          style={{
                            flex: 1,
                            padding: "4px 0",
                            borderRadius: 100,
                            fontSize: 10,
                            fontWeight: 600,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "var(--muted)",
                            cursor: "pointer",
                          }}
                        >
                          {p.activo === false ? "Activar" : "Pausar"}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 100,
                            fontSize: 12,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* ── LISTA ── */
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {productos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "var(--cream)",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      opacity: p.activo === false ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "64px 1fr auto",
                        gap: 14,
                        alignItems: "center",
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "var(--white)",
                          border: "1px solid var(--border)",
                          flexShrink: 0,
                          position: "relative",
                        }}
                      >
                        {editingId === p.id && editProd.imagen ? (
                          <Image
                            src={editProd.imagen}
                            alt={p.nombre}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="64px"
                          />
                        ) : p.imagen ? (
                          <Image
                            src={p.imagen}
                            alt={p.nombre}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="64px"
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 24,
                            }}
                          >
                            🛍️
                          </div>
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--black)",
                            marginBottom: 2,
                          }}
                        >
                          {p.nombre}
                        </p>
                        {p.descripcion && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                              marginBottom: 4,
                            }}
                          >
                            {p.descripcion}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "var(--olive-dark)",
                          }}
                        >
                          ${Number(p.precio).toLocaleString("es-AR")}
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => startEdit(p)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 100,
                              fontSize: 10,
                              fontWeight: 600,
                              border: "1px solid var(--border)",
                              background: "transparent",
                              color: "var(--muted)",
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(p.id, p.activo ?? true)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 100,
                              fontSize: 10,
                              fontWeight: 600,
                              border: "1px solid var(--border)",
                              background: "transparent",
                              color: "var(--muted)",
                              cursor: "pointer",
                            }}
                          >
                            {p.activo === false ? "Activar" : "Pausar"}
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className={styles.iconBtn}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>

                    {editingId === p.id && (
                      <div
                        style={{
                          padding: "12px 16px",
                          borderTop: "1px solid var(--border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <input
                          ref={editFileRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleEditImageUpload(f);
                          }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            className="input-field"
                            value={editProd.nombre}
                            onChange={(e) =>
                              setEditProd((p) => ({
                                ...p,
                                nombre: e.target.value,
                              }))
                            }
                            placeholder="Nombre"
                            style={{
                              flex: 2,
                              fontSize: 13,
                              padding: "8px 12px",
                            }}
                          />
                          <input
                            className="input-field"
                            type="number"
                            value={editProd.precio}
                            onChange={(e) =>
                              setEditProd((p) => ({
                                ...p,
                                precio: e.target.value,
                              }))
                            }
                            placeholder="Precio"
                            style={{
                              flex: 1,
                              fontSize: 13,
                              padding: "8px 12px",
                            }}
                          />
                        </div>
                        <input
                          className="input-field"
                          value={editProd.descripcion}
                          onChange={(e) =>
                            setEditProd((p) => ({
                              ...p,
                              descripcion: e.target.value,
                            }))
                          }
                          placeholder="Descripción"
                          style={{ fontSize: 13, padding: "8px 12px" }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => editFileRef.current?.click()}
                            style={{
                              fontSize: 12,
                              color: "var(--olive)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            📷 Cambiar foto
                          </button>
                          <div style={{ flex: 1 }} />
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            disabled={savingEdit}
                            style={{
                              padding: "7px 18px",
                              borderRadius: 8,
                              border: "none",
                              background: "var(--olive)",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {savingEdit ? "..." : "Guardar"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: "7px 12px",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              background: "transparent",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
