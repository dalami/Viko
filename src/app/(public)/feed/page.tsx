import { createClient } from "../../../lib/server";
import FeedClient from "./FeedClient";

export const metadata = {
  title: "Comunidad — Viko",
  description: "Tips, wins y preguntas de emprendedores argentinos.",
};

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id, tipo, contenido, likes, created_at,
      emprendimientos (
        id, nombre, rubro, slug, images
      )
    `)
    .eq("visible", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: { user } } = await supabase.auth.getUser();

  let miEmprendimiento = null;
  let isAdmin = false;

  if (user) {
    const { data: empData } = await supabase
      .from("emprendimientos")
      .select("id, nombre, plan")
      .eq("user_id", user.id)
      .single();
    miEmprendimiento = empData;

    const { data: adminData } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();
    isAdmin = !!adminData;
  }

  return (
    <FeedClient
      posts={posts ?? []}
      miEmprendimiento={miEmprendimiento}
      userId={user?.id ?? null}
      isAdmin={isAdmin}
    />
  );
}