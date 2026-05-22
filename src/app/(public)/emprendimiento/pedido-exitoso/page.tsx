import Link from "next/link";
import { createClient } from "../../../../lib/server";

interface PageProps {
  searchParams: Promise<{ emp?: string }>;
}

export default async function PedidoExitosoPage({ searchParams }: PageProps) {
  const { emp: empId } = await searchParams;

  let empNombre = "";
  let empWhatsapp = "";
  let empSlug = "";

  if (empId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("emprendimientos")
      .select("nombre, whatsapp, slug")
      .eq("id", empId)
      .single();
    if (data) {
      empNombre = data.nombre;
      empWhatsapp = data.whatsapp ?? "";
      empSlug = data.slug ?? "";
    }
  }

  const waUrl = empWhatsapp
    ? `https://api.whatsapp.com/send?phone=${empWhatsapp}&text=${encodeURIComponent(
        `Hola ${empNombre}! Acabo de hacer un pedido en Viko. ¿Me podés confirmar los detalles de entrega?`,
      )}`
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Syne, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          border: "1px solid #E8E4DC",
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 32px rgba(26,24,20,0.06)",
        }}
      >
        {/* Ícono */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#E8F5EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 24px",
          }}
        >
          ✅
        </div>

        {/* Título */}
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28,
            color: "#1A1814",
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          ¡Pedido confirmado!
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6B7A5A",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          {empNombre
            ? `Tu compra en ${empNombre} fue procesada con éxito.`
            : "Tu compra fue procesada con éxito."}
        </p>

        {/* Aviso de envío */}
        <div
          style={{
            background: "#FFFDE7",
            border: "1px solid #F5D800",
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 28,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#7A6800",
              marginBottom: 6,
            }}
          >
            📦 Coordinación de envío
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#5A5000",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            El vendedor se va a comunicar con vos para coordinar los detalles de
            entrega. Si querés, también podés contactarlo directamente por
            WhatsApp.
          </p>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 24px",
                borderRadius: 100,
                background: "#25D366",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
            >
              💬 Contactar al vendedor por WhatsApp
            </a>
          )}

          {empSlug && (
            <Link
              href={`/emprendimiento/${empSlug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "13px 24px",
                borderRadius: 100,
                border: "1.5px solid #E8E4DC",
                color: "#1A1814",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              ← Volver al emprendimiento
            </Link>
          )}

          <Link
            href="/directorio"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "13px 24px",
              borderRadius: 100,
              background: "transparent",
              color: "#8A8680",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Ver más emprendimientos en Viko →
          </Link>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "#B8B4AC", marginTop: 32 }}>
          Viko — Directorio de emprendimientos argentinos
        </p>
      </div>
    </div>
  );
}
