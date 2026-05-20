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

  async function handlePublish(producto: Producto) {
    setPublishing(producto.id);

    try {
      const res = await fetch("/api/ml/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ producto }),
      });

      const data = await res.json();

      if (data.ok) {
        setResults((prev) => ({
          ...prev,
          [producto.id]: {
            ok: true,
            permalink: data.permalink,
          },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [producto.id]: {
            ok: false,
            error: data.error,
          },
        }));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [producto.id]: {
          ok: false,
          error: "Error de conexión",
        },
      }));
    } finally {
      setPublishing(null);
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
                          onClick={() => handlePublish(p)}
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
                          {isPublishing ? "Publicando..." : "📤 Publicar en ML"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
