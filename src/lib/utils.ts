export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export function planLabel(plan?: string): string {
  if (plan === "premium") return "Viko Pro";
  if (plan === "featured") return "Destacado";
  return "Free";
}
