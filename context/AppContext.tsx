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
import type { StoreOrder } from "@/lib/store-platform";

export type AccountUser = {
  storeId: string;
  phone: string;
  storeName: string;
  storeAddress: string;
  invitationCode: string;
  walletBalanceMMK: number;
  signupBonusMMK: number;
  bonusUnlocked: boolean;
  successfulSales: number;
  createdAt: string;
};

type RegistrationDetails = {
  phone: string;
  storeName: string;
  storeAddress: string;
  password: string;
  invitationCode: string;
};

type AppContextValue = {
  user: AccountUser | null;
  sellerProducts: Product[];
  orders: StoreOrder[];
  hydrated: boolean;
  hydrationError: string;
  register: (details: RegistrationDetails) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addSellerProduct: (product: Product) => Promise<void>;
  refreshStore: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function readResponse(response: Response) {
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request failed.");
  return result;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState("");

  const refreshStore = useCallback(async () => {
    const accountResponse = await fetch("/api/store/auth", { cache: "no-store" });
    const accountResult = await readResponse(accountResponse) as { store: AccountUser | null };
    setUser(accountResult.store);
    if (!accountResult.store) {
      setSellerProducts([]);
      setOrders([]);
      return;
    }
    const [productsResponse, ordersResponse] = await Promise.all([
      fetch("/api/store/products", { cache: "no-store" }),
      fetch("/api/store/orders", { cache: "no-store" }),
    ]);
    const [productResult, orderResult] = await Promise.all([
      readResponse(productsResponse) as Promise<{ products: Product[] }>,
      readResponse(ordersResponse) as Promise<{ orders: StoreOrder[] }>,
    ]);
    setSellerProducts(productResult.products);
    setOrders(orderResult.orders);
  }, []);

  useEffect(() => {
    void refreshStore()
      .catch((error: unknown) => {
        setHydrationError(error instanceof Error ? error.message : "Unable to load store data.");
      })
      .finally(() => setHydrated(true));
  }, [refreshStore]);

  const register = useCallback(async (details: RegistrationDetails) => {
    await readResponse(await fetch("/api/store/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...details }),
    }));
    await refreshStore();
  }, [refreshStore]);

  const login = useCallback(async (phone: string, password: string) => {
    await readResponse(await fetch("/api/store/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", phone, password }),
    }));
    await refreshStore();
  }, [refreshStore]);

  const logout = useCallback(async () => {
    await readResponse(await fetch("/api/store/auth", { method: "DELETE" }));
    setUser(null);
  }, []);

  const addSellerProduct = useCallback(async (product: Product) => {
    await readResponse(await fetch("/api/store/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        description: product.description,
        costPriceMMK: product.costPrice,
        imageUrl: product.images[0],
      }),
    }));
    await refreshStore();
  }, [refreshStore]);

  const value = useMemo(
    () => ({ user, sellerProducts, orders, hydrated, hydrationError, register, login, logout, addSellerProduct, refreshStore }),
    [user, sellerProducts, orders, hydrated, hydrationError, register, login, logout, addSellerProduct, refreshStore],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider.");
  return context;
}
