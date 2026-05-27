// src/lib/plantillas.ts

export interface PlantillaConfig {
  layout:
    | "clasica"
    | "tienda"
    | "story"
    | "bold"
    | "minimalista"
    | "catalogo"
    | "revista"
    | "portfolio"
    | "premium"
    | "mercado"
    | "bento"
    | "lookbook"
    | "hero"
    | "mosaico"
    | "lineal";
  color: string;
}

export function parsePlantilla(raw: unknown): PlantillaConfig {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const p = raw as Record<string, unknown>;
    return {
      layout: (p.layout as PlantillaConfig["layout"]) ?? "tienda",
      color: (p.color as string) ?? "oliva",
    };
  }
  return { layout: "tienda", color: "oliva" };
}

export const LAYOUTS: {
  id: PlantillaConfig["layout"];
  label: string;
  desc: string;
  emoji: string;
}[] = [
  {
    id: "clasica",
    label: "Clásica",
    desc: "Galería + info en dos columnas",
    emoji: "⬛⬜",
  },
  {
    id: "tienda",
    label: "Tienda",
    desc: "Productos como hero principal",
    emoji: "🛍️",
  },
  {
    id: "story",
    label: "Story",
    desc: "Una columna, foto full-width editorial",
    emoji: "📖",
  },
  {
    id: "bold",
    label: "Bold",
    desc: "Imagen de fondo, texto encima",
    emoji: "🔥",
  },
  {
    id: "minimalista",
    label: "Minimalista",
    desc: "Ultra limpio, solo texto",
    emoji: "✦",
  },
  {
    id: "catalogo",
    label: "Catálogo",
    desc: "Lista con imagen grande por producto",
    emoji: "📋",
  },
  {
    id: "revista",
    label: "Revista",
    desc: "Estilo editorial con foto grande y texto lateral",
    emoji: "📰",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    desc: "Foco en imágenes, ideal para creativos",
    emoji: "🎨",
  },
  {
    id: "premium",
    label: "Premium",
    desc: "Diseño lujoso con fondo oscuro y detalles dorados",
    emoji: "✨",
  },
  {
    id: "mercado",
    label: "Mercado",
    desc: "Grilla densa de productos, máxima visibilidad",
    emoji: "🏪",
  },
  {
    id: "bento",
    label: "Bento",
    desc: "Grilla asimétrica estilo Apple",
    emoji: "⬜",
  },
  {
    id: "lookbook",
    label: "Lookbook",
    desc: "Editorial de moda con imagen dominante",
    emoji: "👗",
  },
  {
    id: "hero",
    label: "Hero",
    desc: "Primer producto en pantalla completa",
    emoji: "🌟",
  },
  {
    id: "mosaico",
    label: "Mosaico",
    desc: "Tiles de distintos tamaños tipo vitrina",
    emoji: "🔲",
  },
  {
    id: "lineal",
    label: "Lineal",
    desc: "Timeline vertical con línea central",
    emoji: "⬆️",
  },
];

export const COLORES: Record<
  string,
  {
    label: string;
    accent: string;
    bg: string;
    text: string;
    card: string;
    border: string;
    muted: string;
    dark: string;
  }
> = {
  oliva: {
    label: "Verde oliva",
    accent: "#6B7A5A",
    bg: "#F5F2EC",
    text: "#1A1814",
    card: "#fff",
    border: "#E0DAD0",
    muted: "#8A8680",
    dark: "#4A5A3A",
  },
  dorado: {
    label: "Dorado",
    accent: "#C9A84C",
    bg: "#FDF8EC",
    text: "#1A1814",
    card: "#fff",
    border: "#ECD9A0",
    muted: "#9A8A60",
    dark: "#A08030",
  },
  terracota: {
    label: "Terracota",
    accent: "#C4664A",
    bg: "#FDF0EC",
    text: "#1A1814",
    card: "#fff",
    border: "#ECC0B0",
    muted: "#9A7060",
    dark: "#A04030",
  },
  marino: {
    label: "Azul marino",
    accent: "#1E3A5F",
    bg: "#EEF2F7",
    text: "#0A1828",
    card: "#fff",
    border: "#B0C4DC",
    muted: "#506080",
    dark: "#0A2040",
  },
  rosa: {
    label: "Rosa palo",
    accent: "#C4788A",
    bg: "#FDF0F3",
    text: "#1A1814",
    card: "#fff",
    border: "#ECC0CC",
    muted: "#9A7080",
    dark: "#A05068",
  },
  negro: {
    label: "Negro",
    accent: "#1A1814",
    bg: "#FAFAF7",
    text: "#1A1814",
    card: "#fff",
    border: "#E0DAD0",
    muted: "#8A8680",
    dark: "#000000",
  },
  bordo: {
    label: "Bordo",
    accent: "#7D1935",
    bg: "#F7EEF1",
    text: "#1A1814",
    card: "#fff",
    border: "#DDB0BC",
    muted: "#8A6070",
    dark: "#5A1025",
  },
  celeste: {
    label: "Celeste",
    accent: "#4A9BB5",
    bg: "#EEF6FA",
    text: "#0A2030",
    card: "#fff",
    border: "#A0D0E0",
    muted: "#507080",
    dark: "#307090",
  },
  lila: {
    label: "Lila",
    accent: "#7B5EA7",
    bg: "#F4EFF9",
    text: "#1A1814",
    card: "#fff",
    border: "#C8B0E0",
    muted: "#806090",
    dark: "#5A3A80",
  },
  salmon: {
    label: "Salmón",
    accent: "#E8836A",
    bg: "#FEF2EE",
    text: "#1A1814",
    card: "#fff",
    border: "#F0C0B0",
    muted: "#9A7060",
    dark: "#C06040",
  },
  esmeralda: {
    label: "Verde esmeralda",
    accent: "#1B7A4A",
    bg: "#EDF7F2",
    text: "#0A2018",
    card: "#fff",
    border: "#A0D8B8",
    muted: "#407858",
    dark: "#0A5030",
  },
  tostado: {
    label: "Marrón tostado",
    accent: "#8B6147",
    bg: "#F5EFE8",
    text: "#1A1814",
    card: "#fff",
    border: "#D8C0A8",
    muted: "#806050",
    dark: "#604030",
  },
  coral: {
    label: "Coral vibrante",
    accent: "#FF6B6B",
    bg: "#FFF5F5",
    text: "#1A1814",
    card: "#fff",
    border: "#FFD0D0",
    muted: "#9A7070",
    dark: "#CC4444",
  },
  mint: {
    label: "Menta fresca",
    accent: "#3DAA7A",
    bg: "#F0FBF6",
    text: "#0A2018",
    card: "#fff",
    border: "#A8E4C8",
    muted: "#407860",
    dark: "#1A8050",
  },
  violeta: {
    label: "Violeta intenso",
    accent: "#6C3FF5",
    bg: "#F3EFFF",
    text: "#1A1814",
    card: "#fff",
    border: "#C8B8FF",
    muted: "#706090",
    dark: "#4A20CC",
  },
  naranja: {
    label: "Naranja vibrante",
    accent: "#F57C20",
    bg: "#FFF7EF",
    text: "#1A1814",
    card: "#fff",
    border: "#FFD0A0",
    muted: "#9A7040",
    dark: "#C05010",
  },
  grafito: {
    label: "Grafito oscuro",
    accent: "#9AA0A8",
    bg: "#1E2229",
    text: "#F0F2F5",
    card: "#2A3040",
    border: "#3A4050",
    muted: "#8090A0",
    dark: "#0A0E14",
  },
  nude: {
    label: "Nude elegante",
    accent: "#C4A882",
    bg: "#FAF7F2",
    text: "#1A1814",
    card: "#fff",
    border: "#E8D8C0",
    muted: "#9A8870",
    dark: "#9A7850",
  },
  turquesa: {
    label: "Turquesa",
    accent: "#00B4A6",
    bg: "#EEFAF9",
    text: "#0A2028",
    card: "#fff",
    border: "#A0E0D8",
    muted: "#407870",
    dark: "#008070",
  },
  fucsia: {
    label: "Fucsia",
    accent: "#D4006A",
    bg: "#FFF0F7",
    text: "#1A1814",
    card: "#fff",
    border: "#F0A0CC",
    muted: "#9A4070",
    dark: "#A00050",
  },
  lavanda: {
    label: "Lavanda suave",
    accent: "#9B7EC8",
    bg: "#F7F3FD",
    text: "#1A1814",
    card: "#fff",
    border: "#D8C8F0",
    muted: "#807090",
    dark: "#6A4AA0",
  },
  chocolate: {
    label: "Chocolate",
    accent: "#5C3317",
    bg: "#F7F0EA",
    text: "#1A1814",
    card: "#fff",
    border: "#D4B898",
    muted: "#806050",
    dark: "#3A1A08",
  },
  azulrey: {
    label: "Azul rey",
    accent: "#1A56C4",
    bg: "#EEF4FF",
    text: "#0A1840",
    card: "#fff",
    border: "#A0C0F0",
    muted: "#4060A0",
    dark: "#0A3090",
  },
  verdeagua: {
    label: "Verde agua",
    accent: "#2AAA8A",
    bg: "#EEFAF6",
    text: "#0A2018",
    card: "#fff",
    border: "#A0E0CC",
    muted: "#407860",
    dark: "#0A7050",
  },
  magenta: {
    label: "Magenta",
    accent: "#C4006A",
    bg: "#FFF0F7",
    text: "#1A1814",
    card: "#fff",
    border: "#F0A0CC",
    muted: "#9A4070",
    dark: "#A00050",
  },
  petroleo: {
    label: "Petróleo",
    accent: "#1A6B6B",
    bg: "#EBF5F5",
    text: "#0A2020",
    card: "#fff",
    border: "#9ED0D0",
    muted: "#3A6868",
    dark: "#0A3A3A",
  },
  champagne: {
    label: "Champagne",
    accent: "#B8965A",
    bg: "#FBF8F2",
    text: "#1A1814",
    card: "#fff",
    border: "#E8D8B8",
    muted: "#8A7850",
    dark: "#7A5A28",
  },
  oxido: {
    label: "Óxido",
    accent: "#A8400A",
    bg: "#FBF2EE",
    text: "#1A1814",
    card: "#fff",
    border: "#E8B8A0",
    muted: "#8A5040",
    dark: "#6A2008",
  },
  pizarra: {
    label: "Pizarra",
    accent: "#4A5568",
    bg: "#F0F2F5",
    text: "#1A2030",
    card: "#fff",
    border: "#B8C0CC",
    muted: "#607080",
    dark: "#1A2535",
  },
  cobre: {
    label: "Cobre",
    accent: "#B87333",
    bg: "#FBF5EE",
    text: "#1A1814",
    card: "#fff",
    border: "#E8C898",
    muted: "#8A6840",
    dark: "#7A4A18",
  },
  jade: {
    label: "Jade",
    accent: "#2E8B57",
    bg: "#EEF8F2",
    text: "#0A2018",
    card: "#fff",
    border: "#A8DCC0",
    muted: "#407858",
    dark: "#0A4828",
  },
  durazno: {
    label: "Durazno",
    accent: "#E8836A",
    bg: "#FEF6F3",
    text: "#1A1814",
    card: "#fff",
    border: "#F0C8B8",
    muted: "#9A6858",
    dark: "#A84828",
  },
  noche: {
    label: "Noche",
    accent: "#7B8CDE",
    bg: "#12141C",
    text: "#E8EAF0",
    card: "#1E2030",
    border: "#2A2E40",
    muted: "#6870A0",
    dark: "#080A10",
  },
};

export function getTema(config: PlantillaConfig) {
  return COLORES[config.color] ?? COLORES.oliva;
}
