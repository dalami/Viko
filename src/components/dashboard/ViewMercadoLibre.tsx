"use client";

import { useState } from "react";
import styles from "../dashboard/View.module.css";
import type { Emprendimiento, Producto } from "../../lib/types";
import Image from "next/image";

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
  const [results, setResults] = useState<
    Record<
      string,
      {
        ok: boolean;
        permalink?: string;
        error?: string;
      }
    >
  >({});

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

  async function handleConfirm() {
    if (!preview) return;
    setPublishing(preview.producto.id);
    try {
      const res = await fetch("/api/ml/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto: preview.producto, confirmar: true }),
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
            <div
              style={{
                fontSize: 40,
                marginBottom: 12,
              }}
            >
              🛒
            </div>

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

            <p
              style={{
                fontSize: 12,
                color: "#8A8680",
                margin: 0,
              }}
            >
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
          Elegí qué productos querés publicar en Mercado Libre.
        </p>

        {productos.filter((p) => p.activo !== false).length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            <p style={{ fontSize: 14, color: "#8A8680" }}>
              No tenés productos cargados. Agregá productos en la sección
              &quot;Productos&quot; primero.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
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
                          style={{
                            fontSize: 11,
                            color: "#C4664A",
                            margin: 0,
                          }}
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
                    maxWidth: 400,
                    width: "100%",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                      color: "#1A1814",
                      marginBottom: 20,
                    }}
                  >
                    Confirmar publicación en ML
                  </h3>

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
                    <div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1A1814",
                          margin: "0 0 4px",
                        }}
                      >
                        {preview.titulo}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6B7A5A",
                          fontWeight: 700,
                          margin: "0 0 4px",
                        }}
                      >
                        ${Number(preview.precio).toLocaleString("es-AR")}
                      </p>
                      <p style={{ fontSize: 11, color: "#8A8680", margin: 0 }}>
                        Categoría ML: {preview.categoryName}
                      </p>
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
                        cursor: "pointer",
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
