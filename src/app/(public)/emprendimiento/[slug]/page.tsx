import { createClient } from "../../../../lib/server";
import { notFound } from "next/navigation";
import PublicProfile from "./Publicprofile";
import PublicDirectorio from "./Publicdirectorio";
import { CartProvider } from "../../../../context/CartContext";
import { CartDrawer } from "../../../../components/cart/CartDrawer";
import { CartButton } from "../../../../components/cart/CartButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: emp } = await supabase
    .from("emprendimientos")
    .select("nombre, tagline, descripcion, rubro, ubicacion, images")
    .eq("slug", slug)
    .eq("visible", true)
    .single();

  if (!emp) return { title: "Viko" };

  const descSeo = emp.descripcion
    ? `${emp.tagline} — ${emp.descripcion.slice(0, 120)}...`
    : emp.tagline;

  const keywords = [
    emp.nombre,
    emp.rubro,
    emp.ubicacion,
    `${emp.rubro} ${emp.ubicacion}`,
    `${emp.nombre} ${emp.ubicacion}`,
    "emprendimiento",
    "Viko",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title: `${emp.nombre} — ${emp.rubro} en ${emp.ubicacion || "Argentina"} | Viko`,
    description: descSeo,
    keywords,
    openGraph: {
      title: `${emp.nombre} — ${emp.rubro}`,
      description: descSeo,
      images: emp.images?.[0]
        ? [{ url: emp.images[0], width: 1200, height: 630, alt: emp.nombre }]
        : [],
      type: "website",
      locale: "es_AR",
      siteName: "Viko — Directorio de emprendimientos",
    },
    twitter: {
      card: "summary_large_image",
      title: `${emp.nombre} — ${emp.rubro}`,
      description: descSeo,
      images: emp.images?.[0] ? [emp.images[0]] : [],
    },
    alternates: {
      canonical: `https://viko.ar/emprendimiento/${slug}`,
    },
  };
}

export default async function EmprendimientoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: emp } = await supabase
    .from("emprendimientos")
    .select("*, productos(*)")
    .eq("slug", slug)
    .eq("visible", true)
    .single();

  if (!emp) notFound();

  const { data: relacionados } = await supabase
    .from("emprendimientos")
    .select(
      "id, nombre, rubro, tagline, ubicacion, envios, whatsapp, instagram, images, plan, slug",
    )
    .eq("rubro", emp.rubro)
    .eq("visible", true)
    .neq("id", emp.id)
    .limit(6);

  const cartEmp = {
    id: emp.id,
    nombre: emp.nombre,
    whatsapp: emp.whatsapp ?? "",
    isPro: emp.plan === "premium",
    mpConnected: emp.mp_connected ?? false,
    envios: emp.envios ?? false,
    transferenciaActiva: emp.transferencia_activa ?? false,
    transferenciaCbu: emp.transferencia_cbu ?? "",
    efectivoActivo: emp.efectivo_activo ?? false,
  };

  return (
    <CartProvider>
      <main>
        <PublicProfile
          emp={emp}
          productos={emp.productos ?? []}
          plantilla={emp.plantilla} // ← sacá el ?? "minimalista", pasá directo
        />
        {(relacionados?.length ?? 0) > 0 && (
          <PublicDirectorio
            emprendimientos={relacionados!}
            titulo={`Más emprendimientos de ${emp.rubro}`}
          />
        )}
      </main>
      <CartButton />
      <CartDrawer emp={cartEmp} />
    </CartProvider>
  );
}
