"use client";

import { useState } from "react";

interface MpBannerProps {
  mpConnected: boolean;
  empNombre: string;
}

export default function MpBanner({ mpConnected, empNombre }: MpBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleConectar() {
    setLoading(true);
    window.location.href = "/api/mp/connect";
  }

  if (mpConnected) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "var(--olive-light)",
          borderRadius: 14,
          border: "1px solid rgba(107,122,90,0.3)",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--olive-dark)",
              }}
            >
              MercadoPago conectado
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>
              Tus clientes pueden pagarte directo desde tu ficha
            </p>
          </div>
        </div>
        <button
          onClick={handleConectar}
          style={{
            background: "transparent",
            border: "1px solid var(--olive)",
            borderRadius: 100,
            padding: "6px 14px",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--olive)",
            cursor: "pointer",
          }}
        >
          Reconectar
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px 24px",
        background: "linear-gradient(135deg, #1A1814, #2D2B26)",
        borderRadius: 16,
        border: "1px solid rgba(201,168,76,0.3)",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 20 }}>💳</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#C9A84C" }}>
              Conectá MercadoPago para vender online
            </p>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              maxWidth: 380,
            }}
          >
            Tus clientes podrán comprar tus productos y pagarte directo desde tu
            ficha en Viko. El dinero va a tu cuenta de MercadoPago sin
            intermediarios.
          </p>
        </div>
        <button
          onClick={handleConectar}
          disabled={loading}
          style={{
            background: "#C9A84C",
            border: "none",
            borderRadius: 100,
            padding: "11px 24px",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: "#1A1814",
            cursor: loading ? "default" : "pointer",
            flexShrink: 0,
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Redirigiendo..." : "Conectar MercadoPago"}
        </button>
      </div>
    </div>
  );
}
