export interface Variante {
  tipo: string;
  opciones: string[];
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  precio_descuento?: number;
  stock?: number;
  tags?: string[];
  orden?: number;
  descripcion?: string;
  categoria?: string;
  imagen?: string;
  variantes?: Variante[];
  activo?: boolean;
  emprendimiento_id?: number;
}

export interface Emprendimiento {
  id: number;
  nombre: string;
  rubro: string;
  tagline: string;
  descripcion: string;
  ubicacion: string;
  whatsapp: string;
  instagram: string;
  email: string;
  web: string;
  envios: boolean;
  visible: boolean;
  images?: string[];
  plan?: "basic" | "featured" | "premium";
  historia_origen?: string;
  historia_diferencia?: string;
  historia_cliente?: string;
  highlights?: { icono: string; texto: string }[] | null;
  mp_connected?: boolean;
  mp_access_token?: string;
  transferencia_activa?: boolean;
  transferencia_cbu?: string;
  efectivo_activo?: boolean;
  plantilla?: { layout: string; color: string } | string;
  slug?: string;
}