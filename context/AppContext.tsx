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

export type AccountUser = {
  userId: string;
  name: string;
  phone: string;
  isSeller: boolean;
  walletBalance: number;
  store: StoreProfile | null;
};

export type StoreProfile = {
  name: string;
  address: string;
  categories: string[];
};

type StoredUser = AccountUser & { passwordHash: string };
export type WalletTransaction = {
  id: string;
  userId: string;
  type: "Deposit" | "Withdrawal";
  method: "K Pay" | "Wave Money" | "Wave Pay";
  amount: number;
  createdAt: string;
  accountNumberLast4?: string;
  receiptLast5?: string;
  receiptUploaded?: boolean;
  status?: "Pending" | "Approved" | "Rejected";
};
export type CustomerOrder = {
  id: string;
  buyerId?: string;
  sellerIds: string[];
  items: { name: string; quantity: number; sellerId?: string; price: number }[];
  total: number;
  buyerName: string;
  buyerPhone: string;
  address: string;
  coordinates?: { latitude: number; longitude: number };
  paymentMethod: "K Pay" | "Wave Pay";
  createdAt: string;
};

type AppContextValue = {
  user: AccountUser | null;
  sellerProducts: Product[];
  orders: CustomerOrder[];
  transactions: WalletTransaction[];
  hydrated: boolean;
  register: (details: { name: string; phone: string; password: string }) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  createSellerStore: (store: StoreProfile) => void;
  addSellerProduct: (product: Product) => void;
  addOrder: (order: CustomerOrder) => void;
  recordWalletTransaction: (
    transaction: Omit<WalletTransaction, "id" | "userId" | "createdAt">,
  ) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const USERS_KEY = "evergreen-market-users";
const SESSION_KEY = "evergreen-market-user";
const SELLER_PRODUCTS_KEY = "evergreen-market-seller-products";
const ORDERS_KEY = "evergreen-market-orders";
const TRANSACTIONS_KEY = "evergreen-market-wallet-transactions";

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function loadJson<T>(key: string, fallback: T): T {
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  return JSON.parse(value) as T;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [userId, setUserId] = useState("");
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setUsers(loadJson<StoredUser[]>(USERS_KEY, []));
      setUserId(window.localStorage.getItem(SESSION_KEY) ?? "");
      setSellerProducts(loadJson<Product[]>(SELLER_PRODUCTS_KEY, []));
      setOrders(loadJson<CustomerOrder[]>(ORDERS_KEY, []));
      setTransactions(loadJson<WalletTransaction[]>(TRANSACTIONS_KEY, []));
    } catch (error) {
      console.error("Unable to restore Evergreen account data.", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(sellerProducts));
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    if (userId) window.localStorage.setItem(SESSION_KEY, userId);
    else window.localStorage.removeItem(SESSION_KEY);
  }, [hydrated, users, userId, sellerProducts, orders, transactions]);

  useEffect(() => {
    if (!hydrated || users.length === 0) return;
    void Promise.all(users.map(async ({ userId: registeredUserId, name, phone }) => {
      const response = await fetch("/api/account/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: registeredUserId, name, phone }),
      });
      if (!response.ok) {
        throw new Error(`Account sync failed with status ${response.status}.`);
      }
    })).catch((error: unknown) => {
      console.error("Unable to synchronize local accounts with the admin dashboard.", error);
    });
  }, [hydrated, users]);

  const storedUser = users.find((account) => account.userId === userId);
  const user = useMemo<AccountUser | null>(
    () => storedUser
      ? {
        userId: storedUser.userId,
        name: storedUser.name,
        phone: storedUser.phone,
        isSeller: storedUser.isSeller,
        walletBalance: storedUser.walletBalance,
        store: storedUser.store ?? null,
      }
      : null,
    [storedUser],
  );

  const register = useCallback(
    async ({ name, phone, password }: { name: string; phone: string; password: string }) => {
      if (!hydrated)       throw new Error("account.error.loadingData");
      const normalizedPhone = normalizePhone(phone);
      if (!/^\+?\d{7,15}$/.test(normalizedPhone)) {
        throw new Error("account.error.validPhone");
      }
      if (password.length < 6) {
        throw new Error("account.error.passwordLength");
      }
      if (users.some((account) => account.phone === normalizedPhone)) {
        throw new Error("account.error.phoneExists");
      }
      let newUserId = "";
      do {
        newUserId = `USER-${100000 + Math.floor(Math.random() * 900000)}`;
      } while (users.some((account) => account.userId === newUserId));
      const account: StoredUser = {
        userId: newUserId,
        name: name.trim(),
        phone: normalizedPhone,
        isSeller: false,
        walletBalance: 0,
        store: null,
        passwordHash: await hashPassword(password),
      };
      setUsers((current) => [...current, account]);
      setUserId(newUserId);
    },
    [hydrated, users],
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      const normalizedPhone = normalizePhone(phone);
      const passwordHash = await hashPassword(password);
      const account = users.find(
        (candidate) =>
          candidate.phone === normalizedPhone &&
          candidate.passwordHash === passwordHash,
      );
      if (!account) throw new Error("account.error.login");
      setUserId(account.userId);
    },
    [users],
  );

  const logout = useCallback(() => setUserId(""), []);
  const createSellerStore = useCallback((store: StoreProfile) => {
    if (!userId) throw new Error("account.error.generic");
    const name = store.name.trim();
    const address = store.address.trim();
    const categories = [...new Set(store.categories.map((category) => category.trim()).filter(Boolean))];
    if (!name || !address || categories.length === 0) {
      throw new Error("account.error.storeFields");
    }
    const account = users.find((candidate) => candidate.userId === userId);
    if (!account) throw new Error("account.error.generic");
    if (account.store) throw new Error("account.error.storeExists");
    setUsers((current) =>
      current.map((account) =>
        account.userId === userId
          ? { ...account, isSeller: true, store: { name, address, categories } }
          : account,
      ),
    );
  }, [userId, users]);
  const addSellerProduct = useCallback((product: Product) => {
    setSellerProducts((current) => [product, ...current]);
  }, []);
  const addOrder = useCallback((order: CustomerOrder) => {
    setOrders((current) => [order, ...current]);
  }, []);
  const recordWalletTransaction = useCallback(
    (transaction: Omit<WalletTransaction, "id" | "userId" | "createdAt">) => {
      if (!userId) throw new Error("account.error.generic");
      setTransactions((current) => [
        {
          ...transaction,
          id: `TX-${Date.now()}`,
          userId,
          createdAt: new Date().toISOString(),
          status: "Pending",
        },
        ...current,
      ]);
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      user,
      sellerProducts,
      orders,
      transactions,
      hydrated,
      register,
      login,
      logout,
      createSellerStore,
      addSellerProduct,
      addOrder,
      recordWalletTransaction,
    }),
    [
      user,
      sellerProducts,
      orders,
      transactions,
      hydrated,
      register,
      login,
      logout,
      createSellerStore,
      addSellerProduct,
      addOrder,
      recordWalletTransaction,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider.");
  return context;
}
