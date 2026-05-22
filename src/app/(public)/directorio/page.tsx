import { createClient } from "../../../lib/server";
import DirectorioClient from "./DirectorioClient";

export const metadata = {
  title: "Viko — Directorio de Emprendimientos",
  description: "Descubrí marcas independientes con identidad propia.",
};

export default async function DirectorioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: raw } = await supabase
    .from("emprendimientos")
    .select(
      "id, nombre, rubro, rubros, tagline, ubicacion, envios, whatsapp, instagram, web, images, plan, destacadoSemana, descripcion, slug, productos(nombre)",
    )
    .eq("visible", true)
    .order("plan", { ascending: false })
    .order("created_at", { ascending: false });

  const emprendimientos =
    raw?.map((e) => ({
      ...e,
      productos_nombres:
        e.productos?.map((p: { nombre: string }) => p.nombre) ?? [],
    })) ?? [];

  return (
    <DirectorioClient emprendimientos={emprendimientos} isLoggedIn={!!user} />
  );
}
