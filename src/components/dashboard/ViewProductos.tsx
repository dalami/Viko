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
  precio_descuento?: number;
  stock?: number;
  tags?: string[];
  orden?: number;
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

const CATEGORIAS = [
  "Indumentaria",
  "Calzado",
  "Accesorios",
  "Belleza",
  "Hogar y deco",
  "Alimentos",
  "Bebidas",
  "Arte",
  "Tecnología",
  "Servicios",
  "Digital",
  "Otro",
];

// ─── EditForm con IA ─────────────────────────────────────────────────────────
function EditForm({
  prod,
  onSave,
  onCancel,
  saving,
  userId,
  empId,
  supabase,
}: {
  prod: Producto;
  onSave: (data: Partial<Producto>) => void;
  onCancel: () => void;
  saving: boolean;
  userId: string;
  empId: number;
  supabase: ReturnType<typeof createClient>;
}) {
  const [form, setForm] = useState({
    nombre: prod.nombre,
    precio: String(prod.precio),
    precio_descuento: prod.precio_descuento
      ? String(prod.precio_descuento)
      : "",
    stock: prod.stock !== undefined ? String(prod.stock) : "",
    descripcion: prod.descripcion ?? "",
    categoria: prod.categoria ?? "",
    imagen: prod.imagen ?? "",
    activo: prod.activo !== false,
    tags: (prod.tags ?? []).join(", "),
    variantes: prod.variantes ?? ([] as Variante[]),
  });
  const [uploadingImg, setUploadingImg] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nuevasOpc, setNuevasOpc] = useState("");
  const [loadingAI, setLoadingAI] = useState<"desc" | "titulo" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  async function handleImgUpload(file: File) {
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
      setForm((f) => ({ ...f, imagen: data.publicUrl }));
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingImg(false);
    }
  }

  async function sugerirDescripcion() {
    if (!form.nombre) {
      setAiError("Ingresá un nombre primero");
      return;
    }
    setLoadingAI("desc");
    setAiError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Sos un experto en copywriting para e-commerce latinoamericano.
Generá una descripción atractiva y persuasiva para este producto:
Nombre: ${form.nombre}
Categoría: ${form.categoria || "sin categoría"}
Precio: $${form.precio}
Tags: ${form.tags || "ninguno"}

La descripción debe ser corta (2-3 oraciones), en español rioplatense, destacar los beneficios y motivar la compra. Solo devolvé el texto, sin comillas ni explicaciones extra.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      if (text) setForm((f) => ({ ...f, descripcion: text }));
      else setAiError("No se pudo generar la descripción");
    } catch {
      setAiError("Error al conectar con la IA");
    } finally {
      setLoadingAI(null);
    }
  }

  async function optimizarTitulo() {
    if (!form.nombre) {
      setAiError("Ingresá un nombre primero");
      return;
    }
    setLoadingAI("titulo");
    setAiError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Sos un experto en SEO y e-commerce latinoamericano.
Optimizá este título de producto para que sea más atractivo, claro y vendible:
Título actual: ${form.nombre}
Categoría: ${form.categoria || "sin categoría"}
Tags: ${form.tags || "ninguno"}

Devolvé 3 opciones de título optimizado, una por línea, numeradas (1. 2. 3.). Sin explicaciones extra.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      if (text) {
        const opciones = text
          .split("\n")
          .filter((l: string) => l.trim())
          .slice(0, 3);
        const limpio = opciones.map((o: string) =>
          o.replace(/^\d+\.\s*/, "").trim(),
        );
        setAiTitulos(limpio);
      } else setAiError("No se pudieron generar títulos");
    } catch {
      setAiError("Error al conectar con la IA");
    } finally {
      setLoadingAI(null);
    }
  }

  const [aiTitulos, setAiTitulos] = useState<string[]>([]);

  function agregarVariante() {
    if (!nuevoTipo.trim() || !nuevasOpc.trim()) return;
    const opciones = nuevasOpc
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    setForm((f) => ({
      ...f,
      variantes: [...f.variantes, { tipo: nuevoTipo.trim(), opciones }],
    }));
    setNuevoTipo("");
    setNuevasOpc("");
  }

  function quitarVariante(i: number) {
    setForm((f) => ({
      ...f,
      variantes: f.variantes.filter((_, idx) => idx !== i),
    }));
  }

  function handleSubmit() {
    onSave({
      nombre: form.nombre,
      precio: parseFloat(form.precio) || 0,
      precio_descuento: form.precio_descuento
        ? parseFloat(form.precio_descuento)
        : undefined,
      stock: form.stock !== "" ? parseInt(form.stock) : undefined,
      descripcion: form.descripcion,
      categoria: form.categoria,
      imagen: form.imagen,
      activo: form.activo,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      variantes: form.variantes,
    });
  }

  const descuento =
    form.precio_descuento &&
    parseFloat(form.precio_descuento) < parseFloat(form.precio)
      ? Math.round(
          (1 - parseFloat(form.precio_descuento) / parseFloat(form.precio)) *
            100,
        )
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 16,
        background: "#fff",
        borderRadius: 14,
        border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(26,24,20,0.06)",
      }}
    >
      <input
        ref={editFileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImgUpload(file);
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: 14,
            color: "var(--black)",
          }}
        >
          ✏️ Editando producto
        </p>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--olive)",
            background: "var(--olive-light)",
            border: "none",
            borderRadius: 100,
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          {showPreview ? "Cerrar preview" : "👁 Ver preview"}
        </button>
      </div>

      {/* Preview */}
      {showPreview && (
        <div
          style={{
            background: "var(--cream)",
            borderRadius: 12,
            padding: 16,
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Así se ve en tu tienda
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--white)",
                border: "1px solid var(--border)",
                flexShrink: 0,
                position: "relative",
              }}
            >
              {form.imagen ? (
                <Image
                  src={form.imagen}
                  alt={form.nombre}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="80px"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  🛍️
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--black)",
                  marginBottom: 4,
                }}
              >
                {form.nombre || "Nombre del producto"}
              </p>
              {form.categoria && (
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  {form.categoria}
                </p>
              )}
              {form.descripcion && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {form.descripcion}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {descuento ? (
                  <>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#C4664A",
                      }}
                    >
                      $
                      {parseFloat(form.precio_descuento).toLocaleString(
                        "es-AR",
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        textDecoration: "line-through",
                      }}
                    >
                      ${parseFloat(form.precio).toLocaleString("es-AR")}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#C4664A",
                        color: "#fff",
                        padding: "2px 7px",
                        borderRadius: 100,
                      }}
                    >
                      {descuento}% OFF
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--olive-dark)",
                    }}
                  >
                    ${parseFloat(form.precio || "0").toLocaleString("es-AR")}
                  </span>
                )}
              </div>
              {form.tags && (
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    marginTop: 6,
                  }}
                >
                  {form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 9,
                          padding: "2px 7px",
                          borderRadius: 100,
                          background: "var(--olive-light)",
                          color: "var(--olive-dark)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                </div>
              )}
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1.5px solid var(--olive)",
                  color: "var(--olive)",
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                🛍️ Agregar al carrito
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imagen */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--cream)",
            flexShrink: 0,
            cursor: "pointer",
            border: "1.5px dashed var(--border)",
          }}
          onClick={() => editFileRef.current?.click()}
        >
          {form.imagen ? (
            <Image
              src={form.imagen}
              alt="preview"
              fill
              style={{ objectFit: "cover" }}
              sizes="80px"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              📷
            </div>
          )}
          {uploadingImg && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              ...
            </div>
          )}
        </div>
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--black)",
              marginBottom: 4,
            }}
          >
            Foto del producto
          </p>
          <button
            type="button"
            onClick={() => editFileRef.current?.click()}
            style={{
              fontSize: 11,
              color: "var(--olive)",
              background: "none",
              border: "1px solid var(--olive)",
              borderRadius: 100,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            📷 Cambiar foto
          </button>
        </div>
      </div>

      {/* Nombre + IA */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <label className="field-label" style={{ fontSize: 10, margin: 0 }}>
            Nombre *
          </label>
          <button
            type="button"
            onClick={optimizarTitulo}
            disabled={loadingAI === "titulo"}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#7B5EA7",
              background: "#F4EFF9",
              border: "none",
              borderRadius: 100,
              padding: "3px 10px",
              cursor: "pointer",
              opacity: loadingAI === "titulo" ? 0.6 : 1,
            }}
          >
            {loadingAI === "titulo"
              ? "✨ Generando..."
              : "✨ Optimizar título con IA"}
          </button>
        </div>
        <input
          className="input-field"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          placeholder="Nombre del producto"
          style={{ fontSize: 13, padding: "8px 12px" }}
        />
        {aiTitulos.length > 0 && (
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              Opciones generadas — hacé click para aplicar:
            </p>
            {aiTitulos.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setForm((p) => ({ ...p, nombre: t }));
                  setAiTitulos([]);
                }}
                style={{
                  textAlign: "left",
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #C8B0E0",
                  background: "#F4EFF9",
                  fontSize: 12,
                  color: "#7B5EA7",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categoría */}
      <div>
        <label className="field-label" style={{ fontSize: 10 }}>
          Categoría
        </label>
        <select
          className="input-field"
          value={form.categoria}
          onChange={(e) =>
            setForm((p) => ({ ...p, categoria: e.target.value }))
          }
          style={{ fontSize: 13, padding: "8px 12px" }}
        >
          <option value="">Sin categoría</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Precios y stock */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        <div>
          <label className="field-label" style={{ fontSize: 10 }}>
            Precio *
          </label>
          <input
            className="input-field"
            type="number"
            value={form.precio}
            onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))}
            placeholder="15000"
            style={{ fontSize: 13, padding: "8px 12px" }}
          />
        </div>
        <div>
          <label className="field-label" style={{ fontSize: 10 }}>
            Precio con descuento
          </label>
          <input
            className="input-field"
            type="number"
            value={form.precio_descuento}
            onChange={(e) =>
              setForm((p) => ({ ...p, precio_descuento: e.target.value }))
            }
            placeholder="12000"
            style={{ fontSize: 13, padding: "8px 12px" }}
          />
        </div>
        <div>
          <label className="field-label" style={{ fontSize: 10 }}>
            Stock
          </label>
          <input
            className="input-field"
            type="number"
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
            placeholder="∞"
            style={{ fontSize: 13, padding: "8px 12px" }}
          />
        </div>
      </div>

      {/* Badge descuento preview */}
      {descuento && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "#FEF2EE",
            borderRadius: 8,
            border: "1px solid #FFDDD0",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#C4664A" }}>
            ${parseFloat(form.precio_descuento).toLocaleString("es-AR")}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              textDecoration: "line-through",
            }}
          >
            ${parseFloat(form.precio).toLocaleString("es-AR")}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              background: "#C4664A",
              padding: "2px 8px",
              borderRadius: 100,
            }}
          >
            {descuento}% OFF
          </span>
        </div>
      )}

      {/* Descripción + IA */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <label className="field-label" style={{ fontSize: 10, margin: 0 }}>
            Descripción
          </label>
          <button
            type="button"
            onClick={sugerirDescripcion}
            disabled={loadingAI === "desc"}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#7B5EA7",
              background: "#F4EFF9",
              border: "none",
              borderRadius: 100,
              padding: "3px 10px",
              cursor: "pointer",
              opacity: loadingAI === "desc" ? 0.6 : 1,
            }}
          >
            {loadingAI === "desc" ? "✨ Generando..." : "✨ Sugerir con IA"}
          </button>
        </div>
        <textarea
          className="input-field"
          value={form.descripcion}
          onChange={(e) =>
            setForm((p) => ({ ...p, descripcion: e.target.value }))
          }
          placeholder="Descripción del producto..."
          rows={3}
          style={{ fontSize: 13, padding: "8px 12px", resize: "none" }}
        />
      </div>

      {aiError && (
        <p style={{ fontSize: 11, color: "#C4664A", margin: 0 }}>{aiError}</p>
      )}

      {/* Tags */}
      <div>
        <label className="field-label" style={{ fontSize: 10 }}>
          Tags / Etiquetas
        </label>
        <input
          className="input-field"
          value={form.tags}
          onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          placeholder="Ej: verano, oferta, nuevo"
          style={{ fontSize: 13, padding: "8px 12px" }}
        />
        {form.tags && (
          <div
            style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}
          >
            {form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 100,
                    background: "var(--olive-light)",
                    color: "var(--olive-dark)",
                  }}
                >
                  {t}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Variantes */}
      <div>
        <label className="field-label" style={{ fontSize: 10 }}>
          Variantes
        </label>
        {form.variantes.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {form.variantes.map((v, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  background: "var(--cream)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>{v.tipo}:</span>
                <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>
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
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="input-field"
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            placeholder="Tipo (Color)"
            style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
          />
          <input
            className="input-field"
            value={nuevasOpc}
            onChange={(e) => setNuevasOpc(e.target.value)}
            placeholder="Opciones (Rojo, Azul)"
            style={{ flex: 2, fontSize: 12, padding: "6px 10px" }}
          />
          <button
            type="button"
            onClick={agregarVariante}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: "var(--olive)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Toggle activo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--cream)",
          borderRadius: 10,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--black)" }}>
            Producto activo
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>
            Los clientes pueden verlo y comprarlo
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: form.activo ? "var(--olive)" : "var(--border)",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: form.activo ? 22 : 3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              display: "block",
            }}
          />
        </button>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            background: "var(--olive)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
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
  const [savingEdit, setSavingEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newProd, setNewProd] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    precio_descuento: "",
    stock: "",
    categoria: "",
    imagen: "",
    tags: "",
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
        precio_descuento: newProd.precio_descuento
          ? parseFloat(newProd.precio_descuento)
          : null,
        stock: newProd.stock ? parseInt(newProd.stock) : null,
        categoria: newProd.categoria,
        imagen: newProd.imagen,
        variantes: newProd.variantes,
        tags: newProd.tags
          ? newProd.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        emprendimiento_id: empId,
        activo: true,
        orden: productos.length,
      })
      .select()
      .single();
    if (!error && data) {
      setProductos((prev) => [data, ...prev]);
      setNewProd({
        nombre: "",
        descripcion: "",
        precio: "",
        precio_descuento: "",
        stock: "",
        categoria: "",
        imagen: "",
        tags: "",
        variantes: [],
      });
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleSaveEdit(id: string, updates: Partial<Producto>) {
    setSavingEdit(true);
    const { data, error } = await supabase
      .from("productos")
      .update(updates)
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

  async function moverOrden(id: string, direction: "up" | "down") {
    const sorted = [...productos].sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
    );
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const ordenA = a.orden ?? idx;
    const ordenB = b.orden ?? swapIdx;
    await Promise.all([
      supabase.from("productos").update({ orden: ordenB }).eq("id", a.id),
      supabase.from("productos").update({ orden: ordenA }).eq("id", b.id),
    ]);
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === a.id) return { ...p, orden: ordenB };
        if (p.id === b.id) return { ...p, orden: ordenA };
        return p;
      }),
    );
  }

  const productosSorted = [...productos].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
  );

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
                    <label className="field-label">Nombre *</label>
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
                    <label className="field-label">Categoría</label>
                    <select
                      className="input-field"
                      value={newProd.categoria}
                      onChange={(e) =>
                        setNewProd((p) => ({ ...p, categoria: e.target.value }))
                      }
                    >
                      <option value="">Sin categoría</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className="field-label">Precio *</label>
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
                  <div className={styles.field}>
                    <label className="field-label">Precio con descuento</label>
                    <input
                      className="input-field"
                      type="number"
                      value={newProd.precio_descuento}
                      onChange={(e) =>
                        setNewProd((p) => ({
                          ...p,
                          precio_descuento: e.target.value,
                        }))
                      }
                      placeholder="12000"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className="field-label">Stock</label>
                    <input
                      className="input-field"
                      type="number"
                      value={newProd.stock}
                      onChange={(e) =>
                        setNewProd((p) => ({ ...p, stock: e.target.value }))
                      }
                      placeholder="Sin límite"
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className="field-label">Descripción</label>
                  <input
                    className="input-field"
                    value={newProd.descripcion}
                    onChange={(e) =>
                      setNewProd((p) => ({ ...p, descripcion: e.target.value }))
                    }
                    placeholder="Breve descripción"
                  />
                </div>
                <div className={styles.field}>
                  <label className="field-label">Tags</label>
                  <input
                    className="input-field"
                    value={newProd.tags}
                    onChange={(e) =>
                      setNewProd((p) => ({ ...p, tags: e.target.value }))
                    }
                    placeholder="oferta, nuevo, verano"
                  />
                </div>
                <div className={styles.field}>
                  <label className="field-label">Variantes</label>
                  {newProd.variantes.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {newProd.variantes.map((v, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 12px",
                            background: "var(--cream)",
                            borderRadius: 8,
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
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input-field"
                      value={nuevaVarianteTipo}
                      onChange={(e) => setNuevaVarianteTipo(e.target.value)}
                      placeholder="Tipo (Color)"
                      style={{ flex: 1 }}
                    />
                    <input
                      className="input-field"
                      value={nuevaVarianteOpciones}
                      onChange={(e) => setNuevaVarianteOpciones(e.target.value)}
                      placeholder="Opciones (Rojo, Azul)"
                      style={{ flex: 2 }}
                    />
                    <button
                      type="button"
                      onClick={agregarVariante}
                      className="btn btn-olive"
                      style={{
                        padding: "10px 14px",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      + Add
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
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {productosSorted.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {/* Card fija */}
                    <div
                      style={{
                        background: "var(--cream)",
                        borderRadius: 14,
                        border: `1px solid ${editingId === p.id ? "var(--olive)" : "var(--border)"}`,
                        overflow: "hidden",
                        opacity: p.activo === false ? 0.6 : 1,
                        display: "flex",
                        flexDirection: "column",
                        height: 300,
                      }}
                    >
                      {/* Imagen */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: 160,
                          background: "var(--white)",
                          flexShrink: 0,
                        }}
                      >
                        {p.imagen ? (
                          <Image
                            src={p.imagen}
                            alt={p.nombre}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="180px"
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 36,
                            }}
                          >
                            🛍️
                          </div>
                        )}
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                          }}
                        >
                          {p.activo === false && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: "rgba(26,24,20,0.7)",
                                color: "#fff",
                                padding: "2px 6px",
                                borderRadius: 100,
                              }}
                            >
                              Pausado
                            </span>
                          )}
                          {p.precio_descuento &&
                            p.precio_descuento < p.precio && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  background: "#C4664A",
                                  color: "#fff",
                                  padding: "2px 6px",
                                  borderRadius: 100,
                                }}
                              >
                                -
                                {Math.round(
                                  (1 - p.precio_descuento / p.precio) * 100,
                                )}
                                %
                              </span>
                            )}
                          {p.stock !== undefined &&
                            p.stock !== null &&
                            p.stock <= 5 && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  background: "#C9A84C",
                                  color: "#1A1814",
                                  padding: "2px 6px",
                                  borderRadius: 100,
                                }}
                              >
                                Stock: {p.stock}
                              </span>
                            )}
                        </div>
                      </div>
                      {/* Info — altura fija */}
                      <div
                        style={{
                          padding: "10px 12px",
                          flex: 1,
                          overflow: "hidden",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--black)",
                            marginBottom: 2,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {p.nombre}
                        </p>
                        {p.categoria && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              marginBottom: 3,
                            }}
                          >
                            {p.categoria}
                          </p>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {p.precio_descuento &&
                          p.precio_descuento < p.precio ? (
                            <>
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#C4664A",
                                }}
                              >
                                $
                                {Number(p.precio_descuento).toLocaleString(
                                  "es-AR",
                                )}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--muted)",
                                  textDecoration: "line-through",
                                }}
                              >
                                ${Number(p.precio).toLocaleString("es-AR")}
                              </span>
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--olive-dark)",
                              }}
                            >
                              ${Number(p.precio).toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>
                        {p.tags && p.tags.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              flexWrap: "wrap",
                              marginTop: 4,
                            }}
                          >
                            {p.tags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontSize: 9,
                                  padding: "1px 5px",
                                  borderRadius: 100,
                                  background: "var(--olive-light)",
                                  color: "var(--olive-dark)",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Acciones */}
                      <div
                        style={{
                          padding: "6px 10px",
                          display: "flex",
                          gap: 4,
                          borderTop: "1px solid var(--border)",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={() =>
                            setEditingId(editingId === p.id ? null : p.id)
                          }
                          style={{
                            flex: 1,
                            padding: "5px 0",
                            borderRadius: 100,
                            fontSize: 10,
                            fontWeight: 600,
                            border: `1px solid ${editingId === p.id ? "var(--olive)" : "var(--border)"}`,
                            background:
                              editingId === p.id
                                ? "var(--olive)"
                                : "transparent",
                            color: editingId === p.id ? "#fff" : "var(--muted)",
                            cursor: "pointer",
                          }}
                        >
                          {editingId === p.id ? "✕ Cerrar" : "✏️ Editar"}
                        </button>
                        <button
                          onClick={() => moverOrden(p.id, "up")}
                          disabled={idx === 0}
                          style={{
                            padding: "5px 7px",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 10,
                            opacity: idx === 0 ? 0.3 : 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moverOrden(p.id, "down")}
                          disabled={idx === productosSorted.length - 1}
                          style={{
                            padding: "5px 7px",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 10,
                            opacity:
                              idx === productosSorted.length - 1 ? 0.3 : 1,
                          }}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            padding: "5px 7px",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {/* EditForm debajo de la card */}
                    {editingId === p.id && (
                      <EditForm
                        prod={p}
                        onSave={(u) => handleSaveEdit(p.id, u)}
                        onCancel={() => setEditingId(null)}
                        saving={savingEdit}
                        userId={userId}
                        empId={empId}
                        supabase={supabase}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* ── LISTA ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {productosSorted.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div
                      style={{
                        background: "var(--cream)",
                        borderRadius: 14,
                        border: `1px solid ${editingId === p.id ? "var(--olive)" : "var(--border)"}`,
                        overflow: "hidden",
                        opacity: p.activo === false ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "64px 1fr auto",
                          gap: 12,
                          alignItems: "center",
                          padding: "12px 14px",
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
                          {p.imagen ? (
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 2,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "var(--black)",
                              }}
                            >
                              {p.nombre}
                            </p>
                            {p.activo === false && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  background: "var(--cream)",
                                  color: "var(--muted)",
                                  padding: "1px 6px",
                                  borderRadius: 100,
                                  border: "1px solid var(--border)",
                                }}
                              >
                                Pausado
                              </span>
                            )}
                          </div>
                          {p.categoria && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginBottom: 2,
                              }}
                            >
                              {p.categoria}
                            </p>
                          )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {p.precio_descuento &&
                            p.precio_descuento < p.precio ? (
                              <>
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#C4664A",
                                  }}
                                >
                                  $
                                  {Number(p.precio_descuento).toLocaleString(
                                    "es-AR",
                                  )}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--muted)",
                                    textDecoration: "line-through",
                                  }}
                                >
                                  ${Number(p.precio).toLocaleString("es-AR")}
                                </span>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    background: "#C4664A",
                                    color: "#fff",
                                    padding: "1px 5px",
                                    borderRadius: 100,
                                  }}
                                >
                                  -
                                  {Math.round(
                                    (1 - p.precio_descuento / p.precio) * 100,
                                  )}
                                  %
                                </span>
                              </>
                            ) : (
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "var(--olive-dark)",
                                }}
                              >
                                ${Number(p.precio).toLocaleString("es-AR")}
                              </span>
                            )}
                            {p.stock !== undefined && p.stock !== null && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color:
                                    p.stock <= 5 ? "#C9A84C" : "var(--muted)",
                                }}
                              >
                                · Stock: {p.stock}
                              </span>
                            )}
                          </div>
                          {p.tags && p.tags.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                flexWrap: "wrap",
                                marginTop: 4,
                              }}
                            >
                              {p.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 9,
                                    padding: "1px 6px",
                                    borderRadius: 100,
                                    background: "var(--olive-light)",
                                    color: "var(--olive-dark)",
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            alignItems: "flex-end",
                          }}
                        >
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => moverOrden(p.id, "up")}
                              disabled={idx === 0}
                              style={{
                                padding: "3px 6px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 10,
                                opacity: idx === 0 ? 0.3 : 1,
                              }}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moverOrden(p.id, "down")}
                              disabled={idx === productosSorted.length - 1}
                              style={{
                                padding: "3px 6px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 10,
                                opacity:
                                  idx === productosSorted.length - 1 ? 0.3 : 1,
                              }}
                            >
                              ↓
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() =>
                                setEditingId(editingId === p.id ? null : p.id)
                              }
                              style={{
                                padding: "4px 8px",
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 600,
                                border: `1px solid ${editingId === p.id ? "var(--olive)" : "var(--border)"}`,
                                background:
                                  editingId === p.id
                                    ? "var(--olive)"
                                    : "transparent",
                                color:
                                  editingId === p.id ? "#fff" : "var(--muted)",
                                cursor: "pointer",
                              }}
                            >
                              {editingId === p.id ? "✕" : "✏️ Editar"}
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
                    </div>
                    {editingId === p.id && (
                      <EditForm
                        prod={p}
                        onSave={(u) => handleSaveEdit(p.id, u)}
                        onCancel={() => setEditingId(null)}
                        saving={savingEdit}
                        userId={userId}
                        empId={empId}
                        supabase={supabase}
                      />
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
