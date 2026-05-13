"use client";

import React, { useState } from "react";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  categoria?: string;
  emprendimiento_id?: number;
}

interface ViewProductosProps {
  empId: number;
  isPro: boolean;
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
}

interface NewProductState {
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
}

function ProLock({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1A1814, #2D2B26)",
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
        border: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 10 }}>🛍️</div>
      <p
        style={{
          color: "#C9A84C",
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 6,
        }}
      >
        Productos — Viko Pro
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 13,
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        Mostrá tu catálogo completo con precios y botón de consulta por
        WhatsApp.
      </p>
      <button
        onClick={onUpgrade}
        style={{
          background: "#C9A84C",
          border: "none",
          borderRadius: 100,
          padding: "11px 28px",
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "#1A1814",
          cursor: "pointer",
        }}
      >
        Activar Viko Pro — $9.900/mes
      </button>
    </div>
  );
}

export default function ViewProductos({
  empId,
  isPro,
  productos,
  setProductos,
}: ViewProductosProps) {
  const [adding, setAdding] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [newProd, setNewProd] = useState<NewProductState>({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
  });

  const supabase = createClient();

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  function updateNew(field: keyof NewProductState, value: string) {
    setNewProd((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("productos")
      .insert({
        ...newProd,
        emprendimiento_id: empId,
        precio: parseFloat(newProd.precio),
      })
      .select()
      .single();
    if (!error && data) {
      setProductos((prev) => [data, ...prev]);
      setNewProd({ nombre: "", descripcion: "", precio: "", categoria: "" });
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (!error) setProductos((prev) => prev.filter((p) => p.id !== id));
  }

  if (!isPro) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Catálogo de productos</h3>
          <ProLock onUpgrade={handleUpgrade} />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Catálogo de productos</h3>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "8px 18px", fontSize: "13px" }}
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Cancelar" : "+ Agregar producto"}
          </button>
        </div>

        {adding && (
          <form onSubmit={handleAddProduct} className={styles.addForm}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className="field-label">Nombre del producto</label>
                <input
                  className="input-field"
                  value={newProd.nombre}
                  onChange={(e) => updateNew("nombre", e.target.value)}
                  placeholder="Ej: Bondiola desmechada"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className="field-label">Precio (ARS)</label>
                <input
                  className="input-field"
                  type="number"
                  value={newProd.precio}
                  onChange={(e) => updateNew("precio", e.target.value)}
                  placeholder="4800"
                  required
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className="field-label">Descripción (opcional)</label>
              <input
                className="input-field"
                value={newProd.descripcion}
                onChange={(e) => updateNew("descripcion", e.target.value)}
                placeholder="Breve descripción del producto"
              />
            </div>
            <button
              type="submit"
              className="btn btn-olive"
              style={{ padding: "10px 24px", fontSize: "13px" }}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar producto"}
            </button>
          </form>
        )}

        {productos.length === 0 && !adding ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🛍️</span>
            <p className={styles.emptyTitle}>Todavía no agregaste productos</p>
            <p className={styles.emptySub}>
              Tus productos aparecen en tu perfil y en tu landing page.
            </p>
          </div>
        ) : (
          <div className={styles.productList}>
            {productos.map((p) => (
              <div key={p.id} className={styles.productItem}>
                <div className={styles.productThumb}>🛍️</div>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{p.nombre}</span>
                  {p.descripcion && (
                    <span className={styles.productDesc}>{p.descripcion}</span>
                  )}
                </div>
                <span className={styles.productPrice}>
                  ${Number(p.precio).toLocaleString("es-AR")}
                </span>
                <div className={styles.productActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleDelete(p.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
