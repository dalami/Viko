"use client";

import React, { useState } from "react";
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
import type { Producto, Variante } from "../../lib/types";
import { slugify } from "../../lib/utils";

interface ViewProductosProps {
  empId: number;
  userId: string;
  isPro: boolean;
  mpConnected: boolean;
  empNombre: string;
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  plantilla?: unknown;
  onUpgrade?: () => void;
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

// ─── Edit Drawer ──────────────────────────────────────────────────────────────
function EditDrawer({
  prod,
  onSave,
  onClose,
  saving,
  userId,
  empId,
  supabase,
}: {
  prod: Producto | null;
  onSave: (id: string, data: Partial<Producto>) => void;
  onClose: () => void;
  saving: boolean;
  userId: string;
  empId: number;
  supabase: ReturnType<typeof createClient>;
}) {
  const [form, setForm] = useState({
    nombre: prod?.nombre ?? "",
    precio: String(prod?.precio ?? ""),
    precio_descuento: prod?.precio_descuento
      ? String(prod.precio_descuento)
      : "",
    stock: prod?.stock !== undefined ? String(prod.stock) : "",
    descripcion: prod?.descripcion ?? "",
    categoria: prod?.categoria ?? "",
    imagenes: (prod?.imagenes?.length
      ? prod.imagenes
      : prod?.imagen
        ? [prod.imagen]
        : []) as string[],
    activo: prod?.activo !== false,
    tags: (prod?.tags ?? []).join(", "),
    variantes: prod?.variantes ?? ([] as Variante[]),
  });
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nuevasOpc, setNuevasOpc] = useState("");
  const [loadingAI, setLoadingAI] = useState<"desc" | "titulo" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTitulos, setAiTitulos] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  if (!prod) return null;

  async function handleImgUpload(file: File, slot: number) {
    setUploadingSlot(slot);
    try {
      const ext = file.name.split(".").pop();
      // EditDrawer — handleImgUpload
      const path = `${userId}/${empId}/${crypto.randomUUID()}_${slot}.${ext}`;
      const { error } = await supabase.storage
        .from("productos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("productos").getPublicUrl(path);
      setForm((f) => {
        const imgs = [...f.imagenes];
        imgs[slot] = data.publicUrl;
        return { ...f, imagenes: imgs };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingSlot(null);
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
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Sos un experto en copywriting para e-commerce latinoamericano. Generá una descripción atractiva y persuasiva para este producto:\nNombre: ${form.nombre}\nCategoría: ${form.categoria || "sin categoría"}\nPrecio: $${form.precio}\nTags: ${form.tags || "ninguno"}\n\nLa descripción debe ser corta (2-3 oraciones), en español rioplatense, destacar los beneficios y motivar la compra. Solo devolvé el texto, sin comillas ni explicaciones extra.`,
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
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Sos un experto en SEO y e-commerce latinoamericano. Optimizá este título de producto para que sea más atractivo, claro y vendible:\nTítulo actual: ${form.nombre}\nCategoría: ${form.categoria || "sin categoría"}\nTags: ${form.tags || "ninguno"}\n\nDevolvé 3 opciones de título optimizado, una por línea, numeradas (1. 2. 3.). Sin explicaciones extra.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      if (text) {
        const lines = text
          .split("\n")
          .filter((l: string) => l.trim())
          .slice(0, 3);
        setAiTitulos(
          lines.map((l: string) => l.replace(/^\d+\.\s*/, "").trim()),
        );
      } else setAiError("No se pudieron generar títulos");
    } catch {
      setAiError("Error al conectar con la IA");
    } finally {
      setLoadingAI(null);
    }
  }

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
    onSave(prod!.id, {
      nombre: form.nombre,
      precio: parseFloat(form.precio) || 0,
      precio_descuento: form.precio_descuento
        ? parseFloat(form.precio_descuento)
        : undefined,
      stock: form.stock !== "" ? parseInt(form.stock) : undefined,
      descripcion: form.descripcion,
      categoria: form.categoria,
      imagen: form.imagenes[0] ?? "",
      imagenes: form.imagenes,
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
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,24,20,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 200,
          animation: "fadeIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(480px, 100vw)",
          background: "#FAFAF7",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(26,24,20,0.15)",
          animation: "slideIn 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E8E4DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#1A1814",
              }}
            >
              ✏️ Editar producto
            </p>
            <p style={{ fontSize: 12, color: "#8A8680", marginTop: 2 }}>
              {prod.nombre}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              {showPreview ? "✕ Preview" : "👁 Preview"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#8A8680",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Preview */}
          {showPreview && (
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 16,
                border: "1px solid #E8E4DC",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#8A8680",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Vista previa en tienda
              </p>
              <div
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#F5F2EC",
                    flexShrink: 0,
                    position: "relative",
                    border: "1px solid #E8E4DC",
                  }}
                >
                  {form.imagenes[0] ? (
                    <Image
                      src={form.imagenes[0]}
                      alt={form.nombre}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="100px"
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
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1A1814",
                      marginBottom: 3,
                      lineHeight: 1.3,
                    }}
                  >
                    {form.nombre || "Nombre del producto"}
                  </p>
                  {form.categoria && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "#8A8680",
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
                        color: "#8A8680",
                        marginBottom: 8,
                        lineHeight: 1.5,
                      }}
                    >
                      {form.descripcion}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {descuento ? (
                      <>
                        <span
                          style={{
                            fontSize: 18,
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
                            fontSize: 13,
                            color: "#8A8680",
                            textDecoration: "line-through",
                          }}
                        >
                          ${parseFloat(form.precio).toLocaleString("es-AR")}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: "#C4664A",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: 100,
                          }}
                        >
                          {descuento}% OFF
                        </span>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#6B7A5A",
                        }}
                      >
                        $
                        {parseFloat(form.precio || "0").toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                  {/* Miniaturas de fotos adicionales */}
                  {form.imagenes.length > 1 && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {form.imagenes.slice(1).map((img, i) => (
                        <div
                          key={i}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            overflow: "hidden",
                            position: "relative",
                            border: "1px solid #E8E4DC",
                          }}
                        >
                          <Image
                            src={img}
                            alt={`foto ${i + 2}`}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="32px"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Fotos ── */}
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1A1814",
                marginBottom: 8,
              }}
            >
              Fotos del producto{" "}
              <span style={{ fontSize: 11, color: "#8A8680", fontWeight: 400 }}>
                (hasta 3)
              </span>
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((slot) => {
                const imgUrl = form.imagenes[slot];
                const inputId = `edit-img-${slot}`;
                const isLoading = uploadingSlot === slot;
                return (
                  <div key={slot} style={{ position: "relative" }}>
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImgUpload(file, slot);
                        e.target.value = "";
                      }}
                    />
                    <div
                      onClick={() => document.getElementById(inputId)?.click()}
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#F5F2EC",
                        border: imgUrl
                          ? "1.5px solid #C8D0BC"
                          : "1.5px dashed #C8D0BC",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {isLoading ? (
                        <span style={{ fontSize: 11, color: "#8A8680" }}>
                          ...
                        </span>
                      ) : imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={`foto ${slot + 1}`}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="84px"
                        />
                      ) : (
                        <>
                          <span style={{ fontSize: slot === 0 ? 26 : 20 }}>
                            {slot === 0 ? "📷" : "+"}
                          </span>
                          <span style={{ fontSize: 9, color: "#8A8680" }}>
                            {slot === 0 ? "Principal" : `Foto ${slot + 1}`}
                          </span>
                        </>
                      )}
                    </div>
                    {imgUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((f) => {
                            const imgs = [...f.imagenes];
                            imgs.splice(slot, 1);
                            return { ...f, imagenes: imgs };
                          });
                        }}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#C4664A",
                          border: "none",
                          color: "#fff",
                          fontSize: 10,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        ✕
                      </button>
                    )}
                    {slot === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: -16,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          fontSize: 9,
                          color: "#8A8680",
                        }}
                      >
                        Principal
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "#8A8680", marginTop: 22 }}>
              JPG, PNG o WEBP. Imagen cuadrada ideal.
            </p>
          </div>

          {/* Nombre + IA */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label className="field-label" style={{ margin: 0 }}>
                Nombre *
              </label>
              <button
                type="button"
                onClick={optimizarTitulo}
                disabled={loadingAI === "titulo"}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#7B5EA7",
                  background: "#F4EFF9",
                  border: "none",
                  borderRadius: 100,
                  padding: "4px 12px",
                  cursor: "pointer",
                  opacity: loadingAI === "titulo" ? 0.6 : 1,
                }}
              >
                {loadingAI === "titulo"
                  ? "✨ Generando..."
                  : "✨ Optimizar con IA"}
              </button>
            </div>
            <input
              className="input-field"
              value={form.nombre}
              onChange={(e) =>
                setForm((p) => ({ ...p, nombre: e.target.value }))
              }
              placeholder="Nombre del producto"
            />
            {aiTitulos.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#8A8680",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Opciones — click para aplicar:
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
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid #C8B0E0",
                      background: "#F4EFF9",
                      fontSize: 13,
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
            <label className="field-label">Categoría</label>
            <select
              className="input-field"
              value={form.categoria}
              onChange={(e) =>
                setForm((p) => ({ ...p, categoria: e.target.value }))
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

          {/* Precios y stock */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label className="field-label">Precio *</label>
              <input
                className="input-field"
                type="number"
                value={form.precio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, precio: e.target.value }))
                }
                placeholder="15000"
              />
            </div>
            <div>
              <label className="field-label">Con descuento</label>
              <input
                className="input-field"
                type="number"
                value={form.precio_descuento}
                onChange={(e) =>
                  setForm((p) => ({ ...p, precio_descuento: e.target.value }))
                }
                placeholder="12000"
              />
            </div>
            <div>
              <label className="field-label">Stock</label>
              <input
                className="input-field"
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stock: e.target.value }))
                }
                placeholder="∞"
              />
            </div>
          </div>

          {descuento && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                background: "#FEF2EE",
                borderRadius: 10,
                border: "1px solid #FFDDD0",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#C4664A" }}>
                ${parseFloat(form.precio_descuento).toLocaleString("es-AR")}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#8A8680",
                  textDecoration: "line-through",
                }}
              >
                ${parseFloat(form.precio).toLocaleString("es-AR")}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#C4664A",
                  padding: "2px 10px",
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
                marginBottom: 8,
              }}
            >
              <label className="field-label" style={{ margin: 0 }}>
                Descripción
              </label>
              <button
                type="button"
                onClick={sugerirDescripcion}
                disabled={loadingAI === "desc"}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#7B5EA7",
                  background: "#F4EFF9",
                  border: "none",
                  borderRadius: 100,
                  padding: "4px 12px",
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
              style={{ resize: "none" }}
            />
          </div>

          {aiError && (
            <p
              style={{
                fontSize: 12,
                color: "#C4664A",
                padding: "6px 12px",
                background: "#FEF2EE",
                borderRadius: 8,
              }}
            >
              {aiError}
            </p>
          )}

          {/* Tags */}
          <div>
            <label className="field-label">Tags / Etiquetas</label>
            <input
              className="input-field"
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              placeholder="verano, oferta, nuevo"
            />
            {form.tags && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginTop: 8,
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
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 100,
                        background: "#F0F4EC",
                        color: "#3D6B35",
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
            <label className="field-label">Variantes</label>
            {form.variantes.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {form.variantes.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 14px",
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid #E8E4DC",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1A1814",
                      }}
                    >
                      {v.tipo}:
                    </span>
                    <span style={{ fontSize: 13, color: "#8A8680", flex: 1 }}>
                      {v.opciones.join(", ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarVariante(i)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#C4664A",
                        fontSize: 16,
                        padding: 0,
                        lineHeight: 1,
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
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                placeholder="Tipo (Color)"
                style={{ flex: 1 }}
              />
              <input
                className="input-field"
                value={nuevasOpc}
                onChange={(e) => setNuevasOpc(e.target.value)}
                placeholder="Opciones (Rojo, Azul)"
                style={{ flex: 2 }}
              />
              <button
                type="button"
                onClick={agregarVariante}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#6B7A5A",
                  color: "#fff",
                  fontSize: 12,
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
              padding: "14px 16px",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #E8E4DC",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1A1814",
                  marginBottom: 2,
                }}
              >
                Producto activo
              </p>
              <p style={{ fontSize: 12, color: "#8A8680" }}>
                Los clientes pueden verlo y comprarlo
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                border: "none",
                cursor: "pointer",
                background: form.activo ? "#6B7A5A" : "#D0CCC4",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: form.activo ? 24 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  display: "block",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E8E4DC",
            display: "flex",
            gap: 10,
            flexShrink: 0,
            background: "#FAFAF7",
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 12,
              border: "none",
              background: "#1A1814",
              color: "#FAFAF7",
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "13px 20px",
              borderRadius: 12,
              border: "1.5px solid #E8E4DC",
              background: "transparent",
              fontSize: 14,
              cursor: "pointer",
              color: "#1A1814",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
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
  onUpgrade,
}: ViewProductosProps) {
  const config = parsePlantilla(plantilla);
  const accentColor = COLORES[config.color]?.accent ?? "#6B7A5A";

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [tab, setTab] = useState<"productos" | "plantilla">("productos");
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showAumento, setShowAumento] = useState(false);
  const [porcentajeAumento, setPorcentajeAumento] = useState("");
  const [aplicandoAumento, setAplicandoAumento] = useState(false);

  const [newProd, setNewProd] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    precio_descuento: "",
    stock: "",
    categoria: "",
    imagen: "",
    imagenes: [] as string[],
    tags: "",
    variantes: [] as Variante[],
  });
  const [nuevaVarianteTipo, setNuevaVarianteTipo] = useState("");
  const [nuevaVarianteOpciones, setNuevaVarianteOpciones] = useState("");

  const supabase = createClient();
  const limiteAlcanzado = !isPro && productos.length >= LIMITE_FREE;

  async function handleSelectPlantilla(next: Partial<PlantillaConfig>) {
    const updated: PlantillaConfig = { ...config, ...next };
    onPlantillaChange?.(updated);
    await supabase
      .from("emprendimientos")
      .update({ plantilla: updated })
      .eq("id", empId);
  }

  async function handleImageUpload(file: File, slot = 0) {
    setUploadingSlot(slot);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${empId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("productos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("productos").getPublicUrl(path);
      setNewProd((prev) => {
        const imgs = [...prev.imagenes];
        imgs[slot] = data.publicUrl;
        return { ...prev, imagen: imgs[0] ?? "", imagenes: imgs };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingSlot(null);
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
        imagen: newProd.imagenes[0] ?? "",
        imagenes: newProd.imagenes,
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
        imagenes: [],
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
      setEditingProd(null);
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
    const a = sorted[idx],
      b = sorted[swapIdx];
    const ordenA = a.orden ?? idx,
      ordenB = b.orden ?? swapIdx;
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

  async function handleAumentoMasivo() {
    const pct = parseFloat(porcentajeAumento);
    if (!pct || pct <= 0 || pct > 500) return;
    setAplicandoAumento(true);
    const updates = productos.map((p) => ({
      id: p.id,
      precio: Math.round(p.precio * (1 + pct / 100)),
      precio_descuento: p.precio_descuento
        ? Math.round(p.precio_descuento * (1 + pct / 100))
        : null,
    }));
    await Promise.all(
      updates.map((u) =>
        supabase
          .from("productos")
          .update({ precio: u.precio, precio_descuento: u.precio_descuento })
          .eq("id", u.id),
      ),
    );
    setProductos((prev) =>
      prev.map((p) => {
        const u = updates.find((x) => x.id === p.id)!;
        return {
          ...p,
          precio: u.precio,
          precio_descuento: u.precio_descuento ?? undefined,
        };
      }),
    );
    setShowAumento(false);
    setPorcentajeAumento("");
    setAplicandoAumento(false);
  }

  const productosSorted = [...productos].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
  );

  return (
    <>
      <EditDrawer
        key={editingProd?.id ?? "empty"}
        prod={editingProd}
        onSave={handleSaveEdit}
        onClose={() => setEditingProd(null)}
        saving={savingEdit}
        userId={userId}
        empId={empId}
        supabase={supabase}
      />

      <div className={styles.view}>
        <section className={styles.section}>
          {isPro && (
            <MpBanner mpConnected={mpConnected} empNombre={empNombre} />
          )}

          {/* Banner stock crítico */}
          {(() => {
            const criticos = productos.filter(
              (p) => p.stock !== undefined && p.stock !== null && p.stock <= 5,
            );
            if (criticos.length === 0) return null;
            return (
              <div
                style={{
                  background: "#FEF2EE",
                  border: "1px solid #FFDDD0",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#C4664A",
                    marginBottom: 6,
                  }}
                >
                  ⚠️ Stock bajo en {criticos.length} producto
                  {criticos.length > 1 ? "s" : ""}
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  {criticos.map((p) => (
                    <p key={p.id} style={{ fontSize: 12, color: "#8A8680" }}>
                      <strong style={{ color: "#1A1814" }}>{p.nombre}</strong>
                      {" — "}
                      {p.stock === 0 ? (
                        <span style={{ color: "#C4664A", fontWeight: 700 }}>
                          Sin stock
                        </span>
                      ) : (
                        <span style={{ color: "#C9A84C", fontWeight: 600 }}>
                          Quedan {p.stock} unidad{p.stock === 1 ? "" : "es"}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            );
          })()}

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
                          boxShadow: sel
                            ? `0 0 0 3px ${accentColor}25`
                            : "none",
                          transition: "all 0.18s",
                        }}
                      >
                        <div
                          style={{
                            height: 64,
                            background: sel
                              ? accentColor + "15"
                              : "var(--cream)",
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
                  {isPro && productos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAumento(!showAumento)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      📈 Aumentar precios
                    </button>
                  )}
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

              {/* Modal aumento masivo */}
              {showAumento && (
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: 14,
                    padding: "16px 20px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--black)",
                      flex: 1,
                    }}
                  >
                    Aumentar todos los precios en:
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="number"
                      value={porcentajeAumento}
                      onChange={(e) => setPorcentajeAumento(e.target.value)}
                      placeholder="Ej: 15"
                      min="1"
                      max="500"
                      style={{
                        width: 80,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        fontSize: 14,
                        fontFamily: "inherit",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--muted)",
                      }}
                    >
                      %
                    </span>
                    <button
                      onClick={handleAumentoMasivo}
                      disabled={aplicandoAumento || !porcentajeAumento}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--olive)",
                        color: "#fff",
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        opacity: !porcentajeAumento ? 0.5 : 1,
                      }}
                    >
                      {aplicandoAumento ? "Aplicando..." : "Aplicar"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAumento(false);
                        setPorcentajeAumento("");
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        fontSize: 13,
                        cursor: "pointer",
                        color: "var(--muted)",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

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
                      Activá Pro para productos ilimitados, carrito y
                      MercadoPago.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpgrade?.()}
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

              {/* Formulario agregar */}
              {adding && !limiteAlcanzado && (
                <form onSubmit={handleAddProduct} className={styles.addForm}>
                  {/* Fotos — hasta 3 */}
                  <div className={styles.field}>
                    <label className="field-label">
                      Fotos del producto{" "}
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          fontWeight: 400,
                        }}
                      >
                        (hasta 3)
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[0, 1, 2].map((slot) => {
                        const imgUrl = newProd.imagenes[slot];
                        const inputId = `add-img-${slot}`;
                        const isLoading = uploadingSlot === slot;
                        return (
                          <div key={slot} style={{ position: "relative" }}>
                            <input
                              id={inputId}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImageUpload(f, slot);
                                e.target.value = "";
                              }}
                            />
                            <div
                              onClick={() =>
                                document.getElementById(inputId)?.click()
                              }
                              style={{
                                width: 84,
                                height: 84,
                                borderRadius: 12,
                                border: imgUrl
                                  ? "1.5px solid var(--border-strong)"
                                  : "1.5px dashed var(--border-strong)",
                                background: "var(--cream)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {isLoading ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--muted)",
                                  }}
                                >
                                  ...
                                </span>
                              ) : imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={`foto ${slot + 1}`}
                                  fill
                                  style={{ objectFit: "cover" }}
                                  sizes="84px"
                                />
                              ) : (
                                <>
                                  <span
                                    style={{ fontSize: slot === 0 ? 24 : 18 }}
                                  >
                                    {slot === 0 ? "📷" : "+"}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      color: "var(--muted)",
                                    }}
                                  >
                                    {slot === 0
                                      ? "Principal"
                                      : `Foto ${slot + 1}`}
                                  </span>
                                </>
                              )}
                            </div>
                            {imgUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setNewProd((prev) => {
                                    const imgs = [...prev.imagenes];
                                    imgs.splice(slot, 1);
                                    return {
                                      ...prev,
                                      imagen: imgs[0] ?? "",
                                      imagenes: imgs,
                                    };
                                  })
                                }
                                style={{
                                  position: "absolute",
                                  top: -6,
                                  right: -6,
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  background: "#C4664A",
                                  border: "none",
                                  color: "#fff",
                                  fontSize: 10,
                                  cursor: "pointer",
                                  zIndex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 6,
                      }}
                    >
                      La primera es la imagen principal. Cuadrada ideal.
                    </p>
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
                          setNewProd((p) => ({
                            ...p,
                            categoria: e.target.value,
                          }))
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
                      <label className="field-label">
                        Precio con descuento
                      </label>
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
                        setNewProd((p) => ({
                          ...p,
                          descripcion: e.target.value,
                        }))
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
                        placeholder="Tipo"
                        style={{ flex: 1 }}
                      />
                      <input
                        className="input-field"
                        value={nuevaVarianteOpciones}
                        onChange={(e) =>
                          setNuevaVarianteOpciones(e.target.value)
                        }
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

                  <div style={{ display: "flex" }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: "11px 28px", fontSize: "13px" }}
                      disabled={saving}
                    >
                      {saving ? "Guardando..." : "Guardar producto"}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista / Grid */}
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 12,
                  }}
                >
                  {productosSorted.map((p, idx) => {
                    const tieneDescuento =
                      p.precio_descuento && p.precio_descuento < p.precio;
                    const descPct = tieneDescuento
                      ? Math.round((1 - p.precio_descuento! / p.precio) * 100)
                      : 0;
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: "var(--cream)",
                          borderRadius: 14,
                          border: `1px solid ${editingProd?.id === p.id ? "var(--olive)" : "var(--border)"}`,
                          overflow: "hidden",
                          opacity: p.activo === false ? 0.6 : 1,
                          display: "flex",
                          flexDirection: "column",
                          height: 290,
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: 150,
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
                            {tieneDescuento && (
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
                                -{descPct}%
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
                          {/* Indicador de fotos múltiples */}
                          {p.imagenes && p.imagenes.length > 1 && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 6,
                                right: 6,
                                fontSize: 9,
                                fontWeight: 700,
                                background: "rgba(26,24,20,0.6)",
                                color: "#fff",
                                padding: "2px 6px",
                                borderRadius: 100,
                              }}
                            >
                              📷 {p.imagenes.length}
                            </span>
                          )}
                        </div>
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
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
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
                            {tieneDescuento ? (
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
                        </div>
                        <div
                          style={{
                            padding: "6px 10px",
                            display: "flex",
                            gap: 4,
                            borderTop: "1px solid var(--border)",
                            flexShrink: 0,
                          }}
                        >
                          <button
                            onClick={() =>
                              setEditingProd(
                                editingProd?.id === p.id ? null : p,
                              )
                            }
                            style={{
                              flex: 1,
                              padding: "5px 0",
                              borderRadius: 100,
                              fontSize: 10,
                              fontWeight: 700,
                              border: `1px solid ${editingProd?.id === p.id ? "var(--olive)" : "var(--border)"}`,
                              background:
                                editingProd?.id === p.id
                                  ? "var(--olive)"
                                  : "transparent",
                              color:
                                editingProd?.id === p.id
                                  ? "#fff"
                                  : "var(--muted)",
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Editar
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
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {productosSorted.map((p, idx) => {
                    const tieneDescuento =
                      p.precio_descuento && p.precio_descuento < p.precio;
                    const descPct = tieneDescuento
                      ? Math.round((1 - p.precio_descuento! / p.precio) * 100)
                      : 0;
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: "var(--cream)",
                          borderRadius: 14,
                          border: `1px solid ${editingProd?.id === p.id ? "var(--olive)" : "var(--border)"}`,
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
                              {p.imagenes && p.imagenes.length > 1 && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    background: "#F0EDE6",
                                    color: "#8A8680",
                                    padding: "1px 6px",
                                    borderRadius: 100,
                                  }}
                                >
                                  📷 {p.imagenes.length}
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
                              {tieneDescuento ? (
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
                                    -{descPct}%
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
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
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
                                    idx === productosSorted.length - 1
                                      ? 0.3
                                      : 1,
                                }}
                              >
                                ↓
                              </button>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                onClick={() =>
                                  setEditingProd(
                                    editingProd?.id === p.id ? null : p,
                                  )
                                }
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  border: `1px solid ${editingProd?.id === p.id ? "var(--olive)" : "var(--border)"}`,
                                  background:
                                    editingProd?.id === p.id
                                      ? "var(--olive)"
                                      : "transparent",
                                  color:
                                    editingProd?.id === p.id
                                      ? "#fff"
                                      : "var(--muted)",
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ Editar
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
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
