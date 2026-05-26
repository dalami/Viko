// LayoutTypes.ts — tipos compartidos entre todos los layouts
import type { Producto, EmpPublic } from "../../../../lib/types";
import type { getTema } from "../../../../lib/plantillas";
import type { GridProps } from "./Gridlayouts";

export type Tema = ReturnType<typeof getTema>;

export interface LayoutProps {
  emp: EmpPublic;
  tema: Tema;
  images: string[];
  activeImg: number;
  setActiveImg: (i: number) => void;
  productosActivos: Producto[];
  isPro: boolean;
  gridProps: GridProps;
  onContactWA: () => void;
  onContactIG: () => void;
  onContactWeb: () => void;
}
