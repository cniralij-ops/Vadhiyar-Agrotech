import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "../types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  subTotal: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  subTotal: 0
});

const STORAGE_KEY = "vadhiyar-cart";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved) as CartItem[];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product.isAvailable || product.stock < 1 || quantity < 1) return;
    setItems((prev) => {
      const requestedQuantity = Math.min(Math.floor(quantity), product.stock);
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: Math.min(item.quantity + requestedQuantity, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: requestedQuantity }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const safeQuantity = Math.min(Math.max(quantity, 1), item.product.stock || quantity);
          return { ...item, quantity: safeQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setItems([]);

  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, subTotal }),
    [items, subTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

