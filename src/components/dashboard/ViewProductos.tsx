"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";
import MpBanner from "./MpBanner";

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
}

const LIMITE_FREE = 3;

export default function ViewProductos({
  empId, userId, isPro, mpConnected, empNombre, productos, setProductos,
}: ViewProductosProps) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newProd, setNewProd] = useState({
    nombre: "", descripcion: "", precio: "", categoria: "",
    imagen: "", variantes: [] as Variante[],
  });

  const [nuevaVarianteTipo, setNuevaVarianteTipo] = useState("");
  const [nuevaVarianteOpciones, setNuevaVarianteOpciones] = useState("");

  const supabase = createClient();

  // Límite: free = 3, pro = ilimitado
  const limiteAlcanzado = !isPro && productos.length >= LIMITE_FREE;

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodo: "mensual" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleImageUpload(file: File) {
    setUploadingImg(true);
    try {
      const ext = file.name.split(".").pop();
      const ts = new Date().getTime();
      const path = `${userId}/${empId}/${ts}.${ext}`;
      const { error } = await supabase.storage.from("productos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("productos").getPublicUrl(path);
      setNewProd(prev => ({ ...prev, imagen: data.publicUrl }));
    } catch (err) {
      console.error("Error subiendo imagen:", err);
    } finally {
      setUploadingImg(false);
    }
  }

  function agregarVariante() {
    if (!nuevaVarianteTipo.trim() || !nuevaVarianteOpciones.trim()) return;
    const opciones = nuevaVarianteOpciones.split(",").map(o => o.trim()).filter(Boolean);
    setNewProd(prev => ({
      ...prev,
      variantes: [...prev.variantes, { tipo: nuevaVarianteTipo.trim(), opciones }],
    }));
    setNuevaVarianteTipo("");
    setNuevaVarianteOpciones("");
  }

  function quitarVariante(index: number) {
    setNewProd(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index),
    }));
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
      setProductos(prev => [data, ...prev]);
      setNewProd({ nombre: "", descripcion: "", precio: "", categoria: "", imagen: "", variantes: [] });
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("productos").delete().eq("id", id);
    setProductos(prev => prev.filter(p => p.id !== id));
  }

  async function toggleActivo(id: string, activo: boolean) {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id);
    setProductos(prev => prev.map(p => p.id === id ? { ...p, activo: !activo } : p));
  }

  return (
    <div className={styles.view}>
      <section className={styles.section}>

        {/* Banner MP — solo Pro */}
        {isPro && <MpBanner mpConnected={mpConnected} empNombre={empNombre} />}

        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Catálogo de productos</h3>
            {!isPro && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                Plan Free: {productos.length}/{LIMITE_FREE} productos
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "8px 18px", fontSize: "13px", opacity: limiteAlcanzado ? 0.4 : 1 }}
            onClick={() => !limiteAlcanzado && setAdding(!adding)}
            disabled={limiteAlcanzado}
            title={limiteAlcanzado ? "Límite del plan Free alcanzado" : ""}
          >
            {adding ? "Cancelar" : "+ Agregar producto"}
          </button>
        </div>

        {/* Banner upgrade cuando llega al límite */}
        {limiteAlcanzado && (
          <div style={{
            background: "linear-gradient(135deg, #1A1814, #2D2B26)",
            borderRadius: 14, padding: "18px 20px",
            border: "1px solid rgba(201,168,76,0.3)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 16,
            flexWrap: "wrap",
          }}>
            <div>
              <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                Límite del plan Free alcanzado
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5 }}>
                Activá Pro para cargar productos ilimitados, carrito y MercadoPago.
              </p>
            </div>
            <button onClick={handleUpgrade} style={{
              background: "#C9A84C", border: "none", borderRadius: 100,
              padding: "10px 22px", fontFamily: "Syne, sans-serif",
              fontWeight: 700, fontSize: 12, color: "#1A1814",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              ⚡ Activar Pro — $9.900/mes
            </button>
          </div>
        )}

        {/* FORMULARIO */}
        {adding && !limiteAlcanzado && (
          <form onSubmit={handleAddProduct} className={styles.addForm}>

            {/* Imagen */}
            <div className={styles.field}>
              <label className="field-label">Foto del producto</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {newProd.imagen ? (
                  <div style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <Image src={newProd.imagen} alt="Preview" fill style={{ objectFit: "cover" }} sizes="80px" />
                    <button type="button" onClick={() => setNewProd(prev => ({ ...prev, imagen: "" }))}
                      style={{
                        position: "absolute", top: 4, right: 4, width: 18, height: 18,
                        borderRadius: "50%", background: "rgba(26,24,20,0.7)", border: "none",
                        color: "#FAFAF7", fontSize: 10, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{
                      width: 80, height: 80, borderRadius: 12,
                      border: "1.5px dashed var(--border-strong)",
                      background: "var(--cream)", cursor: "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 4, fontSize: 11, color: "var(--muted)",
                    }}>
                    {uploadingImg ? "..." : <><span style={{ fontSize: 24 }}>📷</span><span>Subir foto</span></>}
                  </button>
                )}
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                  Recomendado: imagen cuadrada, fondo blanco o neutro.
                </p>
              </div>
            </div>

            {/* Nombre y precio */}
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className="field-label">Nombre del producto</label>
                <input className="input-field" value={newProd.nombre}
                  onChange={e => setNewProd(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Remera básica" required />
              </div>
              <div className={styles.field}>
                <label className="field-label">Precio (ARS)</label>
                <input className="input-field" type="number" value={newProd.precio}
                  onChange={e => setNewProd(p => ({ ...p, precio: e.target.value }))}
                  placeholder="15000" required />
              </div>
            </div>

            {/* Descripción */}
            <div className={styles.field}>
              <label className="field-label">Descripción (opcional)</label>
              <input className="input-field" value={newProd.descripcion}
                onChange={e => setNewProd(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Breve descripción del producto" />
            </div>

            {/* Variantes */}
            <div className={styles.field}>
              <label className="field-label">Variantes (opcional)</label>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                Ej: tipo &quot;Color&quot;, opciones &quot;Rojo, Azul, Negro&quot;
              </p>

              {newProd.variantes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {newProd.variantes.map((v, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 14px", background: "var(--cream)",
                      borderRadius: 10, border: "1px solid var(--border)",
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--black)" }}>{v.tipo}:</span>
                      <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>{v.opciones.join(", ")}</span>
                      <button type="button" onClick={() => quitarVariante(i)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--terracota)", fontSize: 14 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label className="field-label" style={{ fontSize: 10 }}>Tipo</label>
                  <input className="input-field" value={nuevaVarianteTipo}
                    onChange={e => setNuevaVarianteTipo(e.target.value)}
                    placeholder="Color / Talle / Tamaño..." />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="field-label" style={{ fontSize: 10 }}>Opciones (separadas por coma)</label>
                  <input className="input-field" value={nuevaVarianteOpciones}
                    onChange={e => setNuevaVarianteOpciones(e.target.value)}
                    placeholder="Rojo, Azul, Negro" />
                </div>
                <button type="button" onClick={agregarVariante}
                  className="btn btn-olive" style={{ padding: "10px 16px", fontSize: 12, flexShrink: 0 }}>
                  + Agregar
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ padding: "11px 28px", fontSize: "13px" }} disabled={saving}>
              {saving ? "Guardando..." : "Guardar producto"}
            </button>
          </form>
        )}

        {/* LISTA */}
        {productos.length === 0 && !adding ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🛍️</span>
            <p className={styles.emptyTitle}>Todavía no agregaste productos</p>
            <p className={styles.emptySub}>Agregá tu catálogo con fotos, precios y variantes.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {productos.map(p => (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "64px 1fr auto",
                gap: 14, alignItems: "center", padding: "14px 16px",
                background: "var(--cream)", borderRadius: 14,
                border: "1px solid var(--border)",
                opacity: p.activo === false ? 0.5 : 1,
              }}>
                {/* Foto */}
                <div style={{
                  width: 64, height: 64, borderRadius: 10, overflow: "hidden",
                  background: "var(--white)", border: "1px solid var(--border)",
                  flexShrink: 0, position: "relative",
                }}>
                  {p.imagen
                    ? <Image src={p.imagen} alt={p.nombre} fill style={{ objectFit: "cover" }} sizes="64px" />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🛍️</div>
                  }
                </div>

                {/* Info */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--black)", marginBottom: 2 }}>{p.nombre}</p>
                  {p.descripcion && <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{p.descripcion}</p>}
                  {p.variantes && p.variantes.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.variantes.map((v, i) => (
                        <span key={i} style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px",
                          borderRadius: 100, background: "var(--white)",
                          border: "1px solid var(--border)", color: "var(--muted)",
                        }}>
                          {v.tipo}: {v.opciones.join(", ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--olive-dark)" }}>
                    ${Number(p.precio).toLocaleString("es-AR")}
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleActivo(p.id, p.activo ?? true)} style={{
                      padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--muted)", cursor: "pointer",
                    }}>
                      {p.activo === false ? "Activar" : "Pausar"}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className={styles.iconBtn} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}