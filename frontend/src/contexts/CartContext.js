import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
const CartContext = createContext({
    items: [],
    addToCart: () => { },
    updateQuantity: () => { },
    removeFromCart: () => { },
    clearCart: () => { },
    subTotal: 0
});
const STORAGE_KEY = "vadhiyar-cart";
export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        if (typeof window === "undefined")
            return [];
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved)
            return [];
        try {
            return JSON.parse(saved);
        }
        catch (error) {
            return [];
        }
    });
    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);
    const addToCart = (product, quantity = 1) => {
        setItems((prev) => {
            const exists = prev.find((item) => item.product.id === product.id);
            if (exists) {
                return prev.map((item) => item.product.id === product.id
                    ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
                    : item);
            }
            return [...prev, { product, quantity }];
        });
    };
    const updateQuantity = (productId, quantity) => {
        setItems((prev) => prev
            .map((item) => {
            if (item.product.id !== productId)
                return item;
            const safeQuantity = Math.min(Math.max(quantity, 1), item.product.stock || quantity);
            return { ...item, quantity: safeQuantity };
        })
            .filter((item) => item.quantity > 0));
    };
    const removeFromCart = (productId) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    };
    const clearCart = () => setItems([]);
    const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);
    const value = useMemo(() => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, subTotal }), [items, subTotal]);
    return _jsx(CartContext.Provider, { value: value, children: children });
};
export const useCart = () => useContext(CartContext);
