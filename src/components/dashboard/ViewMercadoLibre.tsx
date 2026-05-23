"use client";

import { useState } from "react";
import styles from "../dashboard/View.module.css";
import type { Emprendimiento, Producto } from "../../lib/types";
import Image from "next/image";

interface CategoryResult {
  id: string;
  name: string;
}

export default function ViewMercadoLibre({
  emp,
  productos,
}: {
  emp: Emprendimiento;
  productos: Producto[];
}) {
  const [publishing, setPublishing] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    producto: Producto;
    categoryId: string;
    categoryName: string;
    titulo: string;
    precio: number;
  } | null>(null);
  const [previewEdits, setPreviewEdits] = useState<{
    titulo: string;
    precio: string;
    categoryId: string;
    categoryName: string;
  }>({ titulo: "", precio: "", categoryId: "", categoryName: "" });
  const [results, setResults] = useState<
    Record<string, { ok: boolean; permalink?: string; error?: string }>
  >({});

  // Búsqueda de categoría
  const [showCatSearch, setShowCatSearch] = useState(false);
  const [catQuery, setCatQuery] = useState("");
  const [catResults, setCatResults] = useState<CategoryResult[]>([]);
  const [catSearching, setCatSearching] = useState(false);

  async function handlePreview(producto: Producto) {
    setPublishing(producto.id);
    try {
      const res = await fetch("/api/ml/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto, confirmar: false }),
      });
      const data = await res.json();
      if (data.preview) {
        setPreview({ producto, ...data });
        setPreviewEdits({
          titulo: data.titulo,
          precio: String(data.precio),
          categoryId: data.categoryId,
          categoryName: data.categoryName,
        });
        setShowCatSearch(false);
        setCatQuery("");
        setCatResults([]);
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [producto.id]: { ok: false, error: "Error de conexión" },
      }));
    } finally {
      setPublishing(null);
    }
  }

  async function searchCategories() {
    if (!catQuery.trim()) return;
    setCatSearching(true);
    try {
      const res = await fetch(
        `/api/ml/categories?q=${encodeURIComponent(catQuery)}`,
      );
      const data = await res.json();
      setCatResults(data.categories ?? []);
    } catch {
      setCatResults([]);
    } finally {
      setCatSearching(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setPublishing(preview.producto.id);
    try {
      const res = await fetch("/api/ml/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: preview.producto,
          confirmar: true,
          titulo: previewEdits.titulo,
          precio: Number(previewEdits.precio),
          categoryId: previewEdits.categoryId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults((prev) => ({
          ...prev,
          [preview.producto.id]: { ok: true, permalink: data.permalink },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [preview.producto.id]: { ok: false, error: data.error },
        }));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [preview.producto.id]: { ok: false, error: "Error de conexión" },
      }));
    } finally {
      setPublishing(null);
      setPreview(null);
    }
  }

  if (!emp.ml_connected) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Mercado Libre</h3>
          <div
            style={{
              background: "linear-gradient(135deg, #FFE600, #F5D000)",
              borderRadius: 16,
              padding: "32px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "#1A1814",
                marginBottom: 8,
              }}
            >
              Publicá en Mercado Libre
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#3A3530",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Conectá tu cuenta de Mercado Libre y publicá tus productos con un
              clic directamente desde Viko.
            </p>
            <a
              href="/api/ml/connect"
              style={{
                background: "#1A1814",
                color: "#FFE600",
                border: "none",
                borderRadius: 100,
                padding: "12px 28px",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              🔗 Conectar Mercado Libre
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Mercado Libre</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: "#FFFDE7",
            borderRadius: 12,
            border: "1px solid #FFE600",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#1A1814",
                margin: 0,
              }}
            >
              Cuenta conectada
            </p>
            <p style={{ fontSize: 12, color: "#8A8680", margin: 0 }}>
              Podés publicar tus productos directamente en ML
            </p>
          </div>
          <a
            href="/api/ml/connect"
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#8A8680",
              textDecoration: "underline",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Reconectar
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tus productos</h3>
        <p className={styles.sectionSub}>
          Elegí qué productos querés publicar en Mercado Libre. Podés ajustar el
          título, precio y categoría antes de confirmar.
        </p>

        {productos.filter((p) => p.activo !== false).length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 14, color: "#8A8680" }}>
              No tenés productos cargados. Agregá productos en la sección
              &quot;Productos&quot; primero.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {productos
              .filter((p) => p.activo !== false)
              .map((p) => {
                const result = results[p.id];
                const isPublishing = publishing === p.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1fr auto",
                      gap: 14,
                      padding: "14px 16px",
                      background: "#fff",
                      borderRadius: 14,
                      border: `1px solid ${result?.ok ? "#A8D8B8" : "#E8E4DC"}`,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#F5F2EC",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      {p.imagen ? (
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="56px"
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
                          color: "#1A1814",
                          margin: "0 0 2px",
                        }}
                      >
                        {p.nombre}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6B7A5A",
                          margin: 0,
                          fontWeight: 700,
                        }}
                      >
                        $
                        {Number(p.precio_descuento ?? p.precio).toLocaleString(
                          "es-AR",
                        )}
                      </p>
                      {result?.ok && result.permalink && (
                        <a
                          href={result.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 11,
                            color: "#1A56C4",
                            textDecoration: "underline",
                          }}
                        >
                          Ver en ML →
                        </a>
                      )}
                      {result?.error && (
                        <p
                          style={{ fontSize: 11, color: "#C4664A", margin: 0 }}
                        >
                          ⚠️ {result.error}
                        </p>
                      )}
                    </div>

                    <div>
                      {result?.ok ? (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#3DAA7A",
                            background: "rgba(61,170,122,0.1)",
                            padding: "6px 14px",
                            borderRadius: 100,
                          }}
                        >
                          ✓ Publicado
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePreview(p)}
                          disabled={isPublishing}
                          style={{
                            background: "#FFE600",
                            border: "none",
                            borderRadius: 100,
                            padding: "8px 16px",
                            fontFamily: "Syne, sans-serif",
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#1A1814",
                            cursor: isPublishing ? "not-allowed" : "pointer",
                            opacity: isPublishing ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isPublishing ? "Cargando..." : "📤 Publicar en ML"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Modal de confirmación */}
            {preview && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(26,24,20,0.7)",
                  zIndex: 1100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <div
                  style={{
                    background: "#FAFAF7",
                    borderRadius: 20,
                    padding: "32px 28px",
                    maxWidth: 420,
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                      color: "#1A1814",
                      marginBottom: 6,
                    }}
                  >
                    Confirmar publicación en ML
                  </h3>
                  <p
                    style={{ fontSize: 12, color: "#8A8680", marginBottom: 20 }}
                  >
                    Ajustá título, precio y categoría antes de publicar.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginBottom: 20,
                      alignItems: "flex-start",
                    }}
                  >
                    {preview.producto.imagen && (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 10,
                          overflow: "hidden",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={preview.producto.imagen}
                          alt={preview.titulo}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="72px"
                        />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: 11,
                          color: "#8A8680",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Título en ML
                      </label>
                      <input
                        value={previewEdits.titulo}
                        onChange={(e) =>
                          setPreviewEdits((p) => ({
                            ...p,
                            titulo: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1A1814",
                          border: "1px solid #E8E4DC",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                          marginBottom: 10,
                        }}
                      />

                      <label
                        style={{
                          fontSize: 11,
                          color: "#8A8680",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Precio en ML (ARS)
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#6B7A5A",
                          }}
                        >
                          $
                        </span>
                        <input
                          type="number"
                          value={previewEdits.precio}
                          onChange={(e) =>
                            setPreviewEdits((p) => ({
                              ...p,
                              precio: e.target.value,
                            }))
                          }
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#6B7A5A",
                            border: "1px solid #E8E4DC",
                            borderRadius: 8,
                            padding: "7px 10px",
                            fontFamily: "inherit",
                            width: 160,
                          }}
                        />
                      </div>

                      {/* Categoría con opción de cambio */}
                      <label
                        style={{
                          fontSize: 11,
                          color: "#8A8680",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Categoría ML
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#1A1814",
                            background: "#F0EDE6",
                            padding: "5px 10px",
                            borderRadius: 8,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {previewEdits.categoryName}
                        </span>
                        <button
                          onClick={() => {
                            setShowCatSearch(!showCatSearch);
                            setCatResults([]);
                            setCatQuery("");
                          }}
                          style={{
                            fontSize: 11,
                            color: "#1A56C4",
                            background: "none",
                            border: "1px solid #C8D8F0",
                            borderRadius: 8,
                            padding: "5px 10px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {showCatSearch ? "Cancelar" : "Cambiar"}
                        </button>
                      </div>

                      {/* Buscador de categoría inline */}
                      {showCatSearch && (
                        <div
                          style={{
                            background: "#fff",
                            border: "1px solid #E8E4DC",
                            borderRadius: 10,
                            padding: 12,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{ display: "flex", gap: 6, marginBottom: 8 }}
                          >
                            <input
                              placeholder="Ej: ropa mujer, zapatillas, comida..."
                              value={catQuery}
                              onChange={(e) => setCatQuery(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && searchCategories()
                              }
                              style={{
                                flex: 1,
                                fontSize: 13,
                                border: "1px solid #E8E4DC",
                                borderRadius: 8,
                                padding: "6px 10px",
                                fontFamily: "inherit",
                              }}
                            />
                            <button
                              onClick={searchCategories}
                              disabled={catSearching}
                              style={{
                                background: "#1A1814",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "6px 12px",
                                fontSize: 12,
                                fontFamily: "Syne, sans-serif",
                                fontWeight: 700,
                                cursor: catSearching
                                  ? "not-allowed"
                                  : "pointer",
                                opacity: catSearching ? 0.6 : 1,
                              }}
                            >
                              {catSearching ? "..." : "Buscar"}
                            </button>
                          </div>

                          {catResults.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              {catResults.map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => {
                                    setPreviewEdits((p) => ({
                                      ...p,
                                      categoryId: cat.id,
                                      categoryName: cat.name,
                                    }));
                                    setShowCatSearch(false);
                                    setCatResults([]);
                                  }}
                                  style={{
                                    textAlign: "left",
                                    background: "#F5F2EC",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    fontSize: 12,
                                    color: "#1A1814",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  <span style={{ fontWeight: 600 }}>
                                    {cat.name}
                                  </span>
                                  <span
                                    style={{ color: "#8A8680", marginLeft: 6 }}
                                  >
                                    ({cat.id})
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {catResults.length === 0 &&
                            !catSearching &&
                            catQuery && (
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#8A8680",
                                  margin: 0,
                                }}
                              >
                                Sin resultados. Probá otro término.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#FFFDE7",
                      borderRadius: 10,
                      padding: "10px 14px",
                      marginBottom: 20,
                      border: "1px solid #FFE600",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#7A6800", margin: 0 }}>
                      ⚠️ Esta publicación quedará activa en Mercado Libre. Podés
                      pausarla o eliminarla desde tu cuenta de ML.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setPreview(null)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: 12,
                        border: "1.5px solid #E8E4DC",
                        background: "transparent",
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#1A1814",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!!publishing}
                      style={{
                        flex: 2,
                        padding: "12px",
                        borderRadius: 12,
                        border: "none",
                        background: "#FFE600",
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#1A1814",
                        cursor: publishing ? "not-allowed" : "pointer",
                        opacity: publishing ? 0.6 : 1,
                      }}
                    >
                      {publishing ? "Publicando..." : "✅ Confirmar y publicar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
