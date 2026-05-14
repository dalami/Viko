"use client";

import { useCart } from "../../context/CartContext";

export function CartButton() {
  const { totalItems, openCart } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={openCart}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 998,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 22px",
        borderRadius: 100,
        border: "none",
        background: "#1A1814",
        color: "#FAFAF7",
        fontFamily: "Syne, sans-serif",
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 8px 32px rgba(26,24,20,0.25)",
        transition: "transform 0.15s, box-shadow 0.15s",
        animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(26,24,20,0.3)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(26,24,20,0.25)";
      }}
    >
      🛍️
      <span>Ver pedido</span>
      <span style={{
        background: "#C9A84C",
        color: "#1A1814",
        borderRadius: 100,
        padding: "2px 9px",
        fontSize: 13,
        fontWeight: 800,
        minWidth: 24,
        textAlign: "center",
      }}>
        {totalItems}
      </span>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </button>
  );
}