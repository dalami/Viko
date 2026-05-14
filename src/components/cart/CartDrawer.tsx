"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "../../context/CartContext";

interface Emp {
  id: number;
  nombre: string;
  whatsapp?: string;
  isPro: boolean;
  mpConnected: boolean;
  envios?: boolean;
  transferenciaActiva?: boolean;
  transferenciaCbu?: string;
  efectivoActivo?: boolean;
}

export function CartDrawer({ emp }: { emp: Emp }) {
  const { items, total, isOpen, closeCart, removeItem, updateQty, clearCart } =
    useCart();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"cart" | "datos">("cart");

  function buildWAMessage() {
    const lineas = items.map(
      (i) =>
        `• ${i.nombre}${i.variante ? ` (${i.variante.tipo}: ${i.variante.opcion})` : ""} x${i.cantidad} — $${(i.precio * i.cantidad).toLocaleString("es-AR")}`,
    );
    return [
      `Hola ${emp.nombre}! Quiero hacer un pedido desde Viko 🛍️`,
      ``,
      ...lineas,
      ``,
      `*Total: $${total.toLocaleString("es-AR")}*`,
      ``,
      `*Mis datos:*`,
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      emp.envios ? `Dirección: ${direccion}` : "",
      notas ? `Notas: ${notas}` : "",
    ]
      .filter((l) => l !== "")
      .join("\n");
  }

  function handleWhatsApp() {
    if (!emp.whatsapp) return;
    window.open(
      `https://api.whatsapp.com/send?phone=${emp.whatsapp}&text=${encodeURIComponent(buildWAMessage())}`,
      "_blank",
    );
  }

  function handleTransferencia() {
    if (!emp.whatsapp) return;
    const msg =
      buildWAMessage() +
      `\n\n🏦 *Pago por transferencia*\nCBU/Alias: ${emp.transferenciaCbu}`;
    window.open(
      `https://api.whatsapp.com/send?phone=${emp.whatsapp}&text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  function handleEfectivo() {
    if (!emp.whatsapp) return;
    const msg = buildWAMessage() + `\n\n💵 *Pago en efectivo al recibir*`;
    window.open(
      `https://api.whatsapp.com/send?phone=${emp.whatsapp}&text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  async function handleMercadoPago() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emprendimientoId: emp.id,
          items: items.map((i) => ({
            id: i.productoId,
            title:
              i.nombre +
              (i.variante ? ` — ${i.variante.tipo}: ${i.variante.opcion}` : ""),
            quantity: i.cantidad,
            unit_price: i.precio,
            picture_url: i.imagen,
          })),
          payer: { name: nombre, phone: telefono },
          direccion,
          notas,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const canProceed = !!(
    nombre.trim() &&
    telefono.trim() &&
    (!emp.envios || direccion.trim())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,24,20,0.5)",
          backdropFilter: "blur(2px)",
          zIndex: 999,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          background: "#FAFAF7",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(26,24,20,0.15)",
          animation: "slideIn 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #E8E4DC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "datos" && (
              <button
                onClick={() => setStep("cart")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6B7A5A",
                  padding: 0,
                }}
              >
                ←
              </button>
            )}
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: "#1A1814",
              }}
            >
              {step === "cart" ? "Tu pedido" : "Tus datos"}
            </span>
          </div>
          <button
            onClick={closeCart}
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* PASO 1: ITEMS */}
          {step === "cart" && (
            <>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
                  <p
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#1A1814",
                      marginBottom: 6,
                    }}
                  >
                    Tu carrito está vacío
                  </p>
                  <p style={{ fontSize: 13, color: "#8A8680" }}>
                    Agregá productos para hacer tu pedido
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {items.map((item) => (
                    <div
                      key={item.uid}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "64px 1fr",
                        gap: 14,
                        padding: "14px",
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #E8E4DC",
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#F5F2EC",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        {item.imagen ? (
                          <Image
                            src={item.imagen}
                            alt={item.nombre}
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
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
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
                              {item.nombre}
                            </p>
                            {item.variante && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#8A8680",
                                  marginBottom: 4,
                                }}
                              >
                                {item.variante.tipo}: {item.variante.opcion}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.uid)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#BCBAB6",
                              fontSize: 14,
                              padding: 0,
                              flexShrink: 0,
                            }}
                          >
                            🗑️
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              background: "#F5F2EC",
                              borderRadius: 100,
                              overflow: "hidden",
                            }}
                          >
                            <button
                              onClick={() =>
                                updateQty(item.uid, item.cantidad - 1)
                              }
                              style={{
                                width: 32,
                                height: 32,
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 16,
                                color: "#6B7A5A",
                                fontWeight: 700,
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                minWidth: 24,
                                textAlign: "center",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#1A1814",
                              }}
                            >
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() =>
                                updateQty(item.uid, item.cantidad + 1)
                              }
                              style={{
                                width: 32,
                                height: 32,
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 16,
                                color: "#6B7A5A",
                                fontWeight: 700,
                              }}
                            >
                              +
                            </button>
                          </div>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#6B7A5A",
                            }}
                          >
                            $
                            {(item.precio * item.cantidad).toLocaleString(
                              "es-AR",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={clearCart}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#BCBAB6",
                      textAlign: "left",
                      padding: 0,
                    }}
                  >
                    Vaciar carrito
                  </button>
                </div>
              )}
            </>
          )}

          {/* PASO 2: DATOS */}
          {step === "datos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Teléfono *</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 1134567890"
                  type="tel"
                  style={inputStyle}
                />
              </div>
              {emp.envios && (
                <div>
                  <label style={labelStyle}>Dirección de entrega *</label>
                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, número, ciudad"
                    style={inputStyle}
                  />
                </div>
              )}
              <div>
                <label style={labelStyle}>Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Aclaraciones sobre tu pedido..."
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* Resumen */}
              <div
                style={{
                  background: "#F5F2EC",
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: "1px solid #E8E4DC",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#8A8680",
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Resumen
                </p>
                {items.map((i) => (
                  <div
                    key={i.uid}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "#1A1814",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      {i.nombre} x{i.cantidad}
                    </span>
                    <span>
                      ${(i.precio * i.cantidad).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid #E8E4DC",
                    marginTop: 10,
                    paddingTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#1A1814",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#6B7A5A",
                    }}
                  >
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid #E8E4DC",
            background: "#FAFAF7",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {step === "cart" && items.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 14, color: "#8A8680" }}>Total</span>
                <span
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 800,
                    fontSize: 22,
                    color: "#1A1814",
                  }}
                >
                  ${total.toLocaleString("es-AR")}
                </span>
              </div>
              <button onClick={() => setStep("datos")} style={btnPrimary}>
                Continuar con el pedido →
              </button>
            </>
          )}

          {step === "datos" && (
            <>
              {emp.isPro && emp.mpConnected && (
                <button
                  onClick={handleMercadoPago}
                  disabled={!canProceed || loading}
                  style={{
                    ...btnPrimary,
                    background: "#009EE3",
                    opacity: !canProceed || loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Procesando..." : "💳 Pagar con MercadoPago"}
                </button>
              )}

              {emp.transferenciaActiva && emp.transferenciaCbu && (
                <button
                  onClick={handleTransferencia}
                  disabled={!canProceed}
                  style={{ ...btnSecondary, opacity: !canProceed ? 0.5 : 1 }}
                >
                  🏦 Pagar por transferencia
                </button>
              )}

              {emp.efectivoActivo && (
                <button
                  onClick={handleEfectivo}
                  disabled={!canProceed}
                  style={{ ...btnSecondary, opacity: !canProceed ? 0.5 : 1 }}
                >
                  💵 Pagar en efectivo
                </button>
              )}

              {emp.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  disabled={!canProceed}
                  style={{
                    ...btnSecondary,
                    opacity: !canProceed ? 0.5 : 1,
                    fontSize: 13,
                  }}
                >
                  💬 Consultar por WhatsApp
                </button>
              )}

              {!canProceed && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#BCBAB6",
                    textAlign: "center",
                  }}
                >
                  Completá los campos obligatorios para continuar
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6B7A5A",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "block",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1.5px solid #E8E4DC",
  background: "#fff",
  fontSize: 14,
  color: "#1A1814",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  borderRadius: 12,
  border: "none",
  background: "#1A1814",
  color: "#FAFAF7",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
  transition: "opacity 0.15s",
};

const btnSecondary: React.CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: 12,
  border: "1.5px solid #E8E4DC",
  background: "transparent",
  color: "#1A1814",
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  transition: "opacity 0.15s",
};
