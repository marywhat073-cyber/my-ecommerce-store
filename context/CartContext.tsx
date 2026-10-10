"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";
import { getProductCurrency, toMMK } from "@/lib/format";

export type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  promoCode: string;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setPromoCode: (code: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "evergreen-market-cart";
const PROMO_STORAGE_KEY = "evergreen-market-promo";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const savedPromo = window.localStorage.getItem(PROMO_STORAGE_KEY);
      if (savedPromo) setPromoCode(savedPromo);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              item &&
              typeof item.product?.id === "string" &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0,
          )
        ) {
          setItems(parsed as CartItem[]);
        }
      }
    } catch (error) {
      console.error("Unable to restore the saved shopping cart.", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (promoCode) {
        window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
      } else {
        window.localStorage.removeItem(PROMO_STORAGE_KEY);
      }
    }
  }, [hydrated, items, promoCode]);

  useEffect(() => {
    if (hydrated && items.length === 0 && promoCode) {
      setPromoCode("");
    }
  }, [hydrated, items.length, promoCode]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...current, { product, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setItems((current) =>
      current.map((item) =>
        item.product.id === id ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.product.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode("");
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) =>
          total + toMMK(item.product.price, getProductCurrency(item.product)) * item.quantity,
        0,
      ),
      hydrated,
      promoCode,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, hydrated, promoCode, addItem, updateQuantity, removeItem, clearCart],
  );

  return (
    <CartContext.Provider value={{ ...value, setPromoCode }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
