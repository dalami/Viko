"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  uid: string;           // productoId + variante (key único)
  productoId: string;
  nombre: string;
  precio: number;
  imagen?: string;
  variante?: { tipo: string; opcion: string };
  cantidad: number;
}

interface CartContextValue {
  items: CartItem[];
  total: number;
  totalItems: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "uid" | "cantidad">) => void;
  removeItem: (uid: string) => void;
  updateQty: (uid: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart  = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: Omit<CartItem, "uid" | "cantidad">) => {
    const uid = item.productoId + (item.variante ? `__${item.variante.tipo}_${item.variante.opcion}` : "");
    setItems(prev => {
      const existing = prev.find(i => i.uid === uid);
      if (existing) {
        return prev.map(i => i.uid === uid ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { ...item, uid, cantidad: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((uid: string) => {
    setItems(prev => prev.filter(i => i.uid !== uid));
  }, []);

  const updateQty = useCallback((uid: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.uid !== uid));
    } else {
      setItems(prev => prev.map(i => i.uid === uid ? { ...i, cantidad: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total      = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider value={{
      items, total, totalItems, isOpen,
      openCart, closeCart,
      addItem, removeItem, updateQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}