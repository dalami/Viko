// src/lib/plantillas.ts

export interface PlantillaConfig {
  layout: "clasica" | "tienda" | "story" | "bold" | "minimalista" | "catalogo";
  color: string;
}

export function parsePlantilla(raw: unknown): PlantillaConfig {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const p = raw as Record<string, unknown>;
    return {
      layout: (p.layout as PlantillaConfig["layout"]) ?? "clasica",
      color:  (p.color  as string) ?? "oliva",
    };
  }
  return { layout: "clasica", color: "oliva" };
}

export const LAYOUTS: { id: PlantillaConfig["layout"]; label: string; desc: string; emoji: string }[] = [
  { id: "clasica",     label: "Clásica",     desc: "Galería + info en dos columnas",        emoji: "⬛⬜" },
  { id: "tienda",      label: "Tienda",       desc: "Productos como hero principal",          emoji: "🛍️" },
  { id: "story",       label: "Story",        desc: "Una columna, foto full-width editorial", emoji: "📖" },
  { id: "bold",        label: "Bold",         desc: "Imagen de fondo, texto encima",          emoji: "🔥" },
  { id: "minimalista", label: "Minimalista",  desc: "Ultra limpio, solo texto",               emoji: "✦" },
  { id: "catalogo",    label: "Catálogo",     desc: "Lista con imagen grande por producto",   emoji: "📋" },
];

export const COLORES: Record<string, { label: string; accent: string; bg: string; text: string; card: string; border: string; muted: string; dark: string }> = {
  oliva:     { label: "Verde oliva",    accent: "#6B7A5A", bg: "#F5F2EC", text: "#1A1814", card: "#fff",    border: "#E0DAD0", muted: "#8A8680", dark: "#4A5A3A" },
  dorado:    { label: "Dorado",         accent: "#C9A84C", bg: "#FDF8EC", text: "#1A1814", card: "#fff",    border: "#ECD9A0", muted: "#9A8A60", dark: "#A08030" },
  terracota: { label: "Terracota",      accent: "#C4664A", bg: "#FDF0EC", text: "#1A1814", card: "#fff",    border: "#ECC0B0", muted: "#9A7060", dark: "#A04030" },
  marino:    { label: "Azul marino",    accent: "#1E3A5F", bg: "#EEF2F7", text: "#0A1828", card: "#fff",    border: "#B0C4DC", muted: "#506080", dark: "#0A2040" },
  rosa:      { label: "Rosa palo",      accent: "#C4788A", bg: "#FDF0F3", text: "#1A1814", card: "#fff",    border: "#ECC0CC", muted: "#9A7080", dark: "#A05068" },
  negro:     { label: "Negro",          accent: "#1A1814", bg: "#FAFAF7", text: "#1A1814", card: "#fff",    border: "#E0DAD0", muted: "#8A8680", dark: "#000000" },
  bordo:     { label: "Bordo",          accent: "#7D1935", bg: "#F7EEF1", text: "#1A1814", card: "#fff",    border: "#DDB0BC", muted: "#8A6070", dark: "#5A1025" },
  celeste:   { label: "Celeste",        accent: "#4A9BB5", bg: "#EEF6FA", text: "#0A2030", card: "#fff",    border: "#A0D0E0", muted: "#507080", dark: "#307090" },
  lila:      { label: "Lila",           accent: "#7B5EA7", bg: "#F4EFF9", text: "#1A1814", card: "#fff",    border: "#C8B0E0", muted: "#806090", dark: "#5A3A80" },
  salmon:    { label: "Salmón",         accent: "#E8836A", bg: "#FEF2EE", text: "#1A1814", card: "#fff",    border: "#F0C0B0", muted: "#9A7060", dark: "#C06040" },
  esmeralda: { label: "Verde esmeralda",accent: "#1B7A4A", bg: "#EDF7F2", text: "#0A2018", card: "#fff",    border: "#A0D8B8", muted: "#407858", dark: "#0A5030" },
  tostado:   { label: "Marrón tostado", accent: "#8B6147", bg: "#F5EFE8", text: "#1A1814", card: "#fff",    border: "#D8C0A8", muted: "#806050", dark: "#604030" },
};

export function getTema(config: PlantillaConfig) {
  return COLORES[config.color] ?? COLORES.oliva;
}