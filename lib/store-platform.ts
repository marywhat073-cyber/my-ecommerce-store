import "server-only";

import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  randomUUID,
} from "node:crypto";
import { promisify } from "node:util";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { products, type Product } from "@/lib/products";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "evergreen-store-session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;
const SIGNUP_BONUS_MMK = 135_000;
const storePath = path.join(process.cwd(), "data", "store-platform.json");

export class StorePlatformError extends Error {}

export type StoreAccount = {
  storeId: string;
  phone: string;
  passwordHash: string;
  storeName: string;
  storeAddress: string;
  invitationCode: string;
  registrationIp: string;
  walletBalanceMMK: number;
  signupBonusMMK: number;
  bonusUnlocked: boolean;
  successfulSales: number;
  createdAt: string;
};

export type StoreOrder = {
  id: string;
  buyerStoreId: string;
  paymentMethod: "K Pay" | "Wave Pay";
  items: { productId: string; name: string; quantity: number; unitPriceMMK: number; costPriceMMK: number; sellerStoreId?: string }[];
  totalMMK: number;
  address: string;
  status: "Processing" | "Delivered";
  createdAt: string;
  deliveredAt?: string;
};

export type SupportTicket = {
  id: string;
  storeId: string;
  message: string;
  status: "Open" | "Resolved";
  createdAt: string;
  resolution?: string;
  resolvedAt?: string;
};

type WalletEntry = {
  id: string;
  storeId: string;
  action: "Deposit" | "Withdrawal" | "Sale";
  amountMMK: number;
  note: string;
  createdAt: string;
};

type PlatformData = {
  accounts: StoreAccount[];
  products: Product[];
  orders: StoreOrder[];
  tickets: SupportTicket[];
  walletEntries: WalletEntry[];
};

export type PublicStoreAccount = Omit<StoreAccount, "passwordHash" | "registrationIp">;

function blankData(): PlatformData {
  return { accounts: [], products: [], orders: [], tickets: [], walletEntries: [] };
}

let pendingWrite: Promise<void> = Promise.resolve();

async function readData(): Promise<PlatformData> {
  try {
    const parsed: unknown = JSON.parse(await readFile(storePath, "utf8"));
    if (
      typeof parsed !== "object" || parsed === null ||
      !("accounts" in parsed) || !Array.isArray(parsed.accounts) ||
      !("products" in parsed) || !Array.isArray(parsed.products) ||
      !("orders" in parsed) || !Array.isArray(parsed.orders) ||
      !("tickets" in parsed) || !Array.isArray(parsed.tickets) ||
      !("walletEntries" in parsed) || !Array.isArray(parsed.walletEntries)
    ) {
      throw new Error("Store platform data has an invalid format.");
    }
    return parsed as PlatformData;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return blankData();
    throw error;
  }
}

async function writeData(data: PlatformData) {
  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, storePath);
}

async function updateData<T>(update: (data: PlatformData) => T): Promise<T> {
  const operation = pendingWrite.then(async () => {
    const data = await readData();
    const result = update(data);
    await writeData(data);
    return result;
  });
  pendingWrite = operation.then(() => undefined, () => undefined);
  return operation;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex || !/^[a-f\d]+$/i.test(saltHex) || !/^[a-f\d]+$/i.test(hashHex)) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sessionSecret() {
  const secret = process.env.STORE_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("STORE_SESSION_SECRET must contain at least 32 characters.");
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

async function setSession(storeId: string) {
  const payload = `${storeId}.${Date.now()}.${randomBytes(16).toString("base64url")}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearStoreSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentStoreId() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [storeId, issuedAtText, nonce, signature] = parts;
  const issuedAt = Number(issuedAtText);
  if (!/^STORE-[A-F0-9]{12}$/.test(storeId) || !Number.isSafeInteger(issuedAt) || !nonce || !signature) return null;
  const age = Date.now() - issuedAt;
  if (age < 0 || age > SESSION_SECONDS * 1000) return null;
  const payload = `${storeId}.${issuedAtText}.${nonce}`;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied) ? storeId : null;
}

function publicAccount(account: StoreAccount): PublicStoreAccount {
  return {
    storeId: account.storeId,
    phone: account.phone,
    storeName: account.storeName,
    storeAddress: account.storeAddress,
    invitationCode: account.invitationCode,
    walletBalanceMMK: account.walletBalanceMMK,
    signupBonusMMK: account.signupBonusMMK,
    bonusUnlocked: account.bonusUnlocked,
    successfulSales: account.successfulSales,
    createdAt: account.createdAt,
  };
}

export async function getCurrentStore(): Promise<PublicStoreAccount | null> {
  const storeId = await getCurrentStoreId();
  if (!storeId) return null;
  await pendingWrite;
  const data = await readData();
  const account = data.accounts.find((item) => item.storeId === storeId);
  return account ? publicAccount(account) : null;
}

export async function registerStore(input: {
  phone: string;
  storeName: string;
  storeAddress: string;
  password: string;
  invitationCode: string;
  registrationIp: string;
}) {
  sessionSecret();
  const phone = input.phone.replace(/[^\d+]/g, "");
  const storeName = input.storeName.trim();
  const storeAddress = input.storeAddress.trim();
  const invitationCode = input.invitationCode.trim();
  if (!/^\+?\d{7,15}$/.test(phone)) throw new StorePlatformError("Enter a valid phone number.");
  if (storeName.length < 2 || storeName.length > 100) throw new StorePlatformError("Store name must be between 2 and 100 characters.");
  if (storeAddress.length < 5 || storeAddress.length > 300) throw new StorePlatformError("Enter a complete store address.");
  if (input.password.length < 8 || input.password.length > 128) throw new StorePlatformError("Password must be between 8 and 128 characters.");
  if (invitationCode.length > 80) throw new StorePlatformError("Invitation code is too long.");
  const validInvitationCode = process.env.STORE_INVITATION_CODE ?? "";
  const suppliedCode = Buffer.from(invitationCode);
  const configuredCode = Buffer.from(validInvitationCode);
  const bonus = Boolean(invitationCode && validInvitationCode &&
    suppliedCode.length === configuredCode.length && timingSafeEqual(suppliedCode, configuredCode));
  const passwordHash = await hashPassword(input.password);
  return updateData((data) => {
    if (data.accounts.some((account) => account.phone === phone)) throw new StorePlatformError("An account already uses this phone number.");
    let storeId = "";
    do {
      storeId = `STORE-${randomBytes(6).toString("hex").toUpperCase()}`;
    } while (data.accounts.some((account) => account.storeId === storeId));
    const account: StoreAccount = {
      storeId,
      phone,
      passwordHash,
      storeName,
      storeAddress,
      invitationCode,
      registrationIp: input.registrationIp.slice(0, 100),
      walletBalanceMMK: bonus ? SIGNUP_BONUS_MMK : 0,
      signupBonusMMK: bonus ? SIGNUP_BONUS_MMK : 0,
      bonusUnlocked: false,
      successfulSales: 0,
      createdAt: new Date().toISOString(),
    };
    data.accounts.push(account);
    return publicAccount(account);
  });
}

export async function loginStore(phone: string, password: string) {
  const normalizedPhone = phone.replace(/[^\d+]/g, "");
  await pendingWrite;
  const data = await readData();
  const account = data.accounts.find((candidate) => candidate.phone === normalizedPhone);
  if (!account || !(await verifyPassword(password, account.passwordHash))) return null;
  await setSession(account.storeId);
  return publicAccount(account);
}

export async function finishRegistrationSession(storeId: string) {
  await setSession(storeId);
}

export async function listStoreProducts() {
  await pendingWrite;
  return (await readData()).products;
}

export async function addStoreProduct(storeId: string, input: {
  name: string;
  category: string;
  description: string;
  costPriceMMK: number;
  imageUrl: string;
}) {
  const name = input.name.trim();
  const description = input.description.trim();
  const allowedCategories = ["Men's Clothing", "Women's Clothing", "Home Appliances", "Kitchenware", "Building Materials"];
  if (name.length < 2 || name.length > 120 || description.length > 1000) throw new StorePlatformError("Enter valid product details.");
  if (!allowedCategories.includes(input.category)) throw new StorePlatformError("Choose a supported product category.");
  if (!Number.isSafeInteger(input.costPriceMMK) || input.costPriceMMK < 1 || input.costPriceMMK > 1_000_000_000) throw new StorePlatformError("Enter a valid MMK product cost.");
  let image: URL;
  try {
    image = new URL(input.imageUrl);
  } catch {
    throw new StorePlatformError("Enter a valid HTTPS product image URL.");
  }
  if (image.protocol !== "https:") throw new StorePlatformError("Product image URLs must use HTTPS.");
  return updateData((data) => {
    if (!data.accounts.some((account) => account.storeId === storeId)) throw new StorePlatformError("Store account not found.");
    const product: Product = {
      id: `seller-${randomUUID()}`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomBytes(4).toString("hex")}`,
      name,
      category: input.category,
      price: Math.ceil(input.costPriceMMK * 110 / 100),
      costPrice: input.costPriceMMK,
      currency: "MMK",
      rating: 0,
      reviewCount: 0,
      badge: "Store Listed",
      description,
      details: ["Listed without upfront inventory costs."],
      images: [image.toString()],
      sellerId: storeId,
    };
    data.products.unshift(product);
    return product;
  });
}

export async function createStoreOrder(input: {
  buyerStoreId: string;
  items: { productId: string; quantity: number }[];
  address: string;
  paymentMethod: "K Pay" | "Wave Pay";
  promoCode: string;
}) {
  if (!input.items.length || input.items.length > 50) throw new StorePlatformError("The order must contain between 1 and 50 products.");
  if (input.address.trim().length < 8 || input.address.length > 500) throw new StorePlatformError("Enter a valid delivery address.");
  return updateData((data) => {
    if (!data.accounts.some((account) => account.storeId === input.buyerStoreId)) throw new StorePlatformError("Store account not found.");
    const items = input.items.map(({ productId, quantity }) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) throw new StorePlatformError("Invalid product quantity.");
      const product = data.products.find((item) => item.id === productId) ?? products.find((item) => item.id === productId);
      if (!product) throw new StorePlatformError("One of the store-listed products is no longer available.");
      if (product.sellerId === input.buyerStoreId) throw new StorePlatformError("A store cannot place orders for its own listings.");
      return {
        productId,
        name: product.name,
        quantity,
        unitPriceMMK: Math.round(toMMK(product.price, product.currency ?? "USD")),
        costPriceMMK: product.costPrice ?? 0,
        sellerStoreId: product.sellerId,
      };
    });
    const subtotal = items.reduce((total, item) => total + item.unitPriceMMK * item.quantity, 0);
    const discountedSubtotal = input.promoCode === "WELCOME10" ? subtotal * 0.9 : subtotal;
    const order: StoreOrder = {
      id: `ORD-${randomUUID()}`,
      buyerStoreId: input.buyerStoreId,
      paymentMethod: input.paymentMethod,
      items,
      totalMMK: Math.round(discountedSubtotal * 1.08),
      address: input.address.trim(),
      status: "Processing",
      createdAt: new Date().toISOString(),
    };
    data.orders.unshift(order);
    return order;
  });
}

export async function listStoreOrders(storeId: string) {
  await pendingWrite;
  const data = await readData();
  return data.orders.filter((order) =>
    order.buyerStoreId === storeId || order.items.some((item) => item.sellerStoreId === storeId),
  );
}

function toMMK(price: number, currency: "USD" | "MMK") {
  return currency === "USD" ? price * 4500 : price;
}

export async function createSupportTicket(storeId: string, message: string) {
  const cleaned = message.trim();
  if (cleaned.length < 5 || cleaned.length > 1000) throw new StorePlatformError("Support message must be between 5 and 1,000 characters.");
  return updateData((data) => {
    if (!data.accounts.some((account) => account.storeId === storeId)) throw new StorePlatformError("Store account not found.");
    const ticket: SupportTicket = {
      id: `TKT-${randomUUID()}`,
      storeId,
      message: cleaned,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
    data.tickets.unshift(ticket);
    return ticket;
  });
}

export async function getServiceDashboard() {
  await pendingWrite;
  const data = await readData();
  return {
    accounts: data.accounts.map(({ storeId, phone, storeName, storeAddress, invitationCode, registrationIp, walletBalanceMMK, signupBonusMMK, bonusUnlocked, successfulSales, createdAt }) => ({
      storeId, phone, storeName, storeAddress, invitationCode, registrationIp, walletBalanceMMK, signupBonusMMK, bonusUnlocked, successfulSales, createdAt,
      passwordStatus: "Scrypt hash stored server-side",
    })),
    products: data.products,
    orders: data.orders,
    tickets: data.tickets,
    walletEntries: data.walletEntries,
  };
}

export async function serviceAction(input: {
  action: "deposit" | "withdraw" | "deliver" | "resolve";
  storeId?: string;
  amountMMK?: number;
  note?: string;
  orderId?: string;
  ticketId?: string;
}) {
  return updateData((data) => {
    if (input.action === "deposit" || input.action === "withdraw") {
      const account = data.accounts.find((item) => item.storeId === input.storeId);
      const amount = input.amountMMK;
      if (!account || !Number.isSafeInteger(amount) || !amount || amount < 1 || amount > 1_000_000_000) throw new StorePlatformError("Select an account and enter a valid amount.");
      if (input.action === "deposit" && !Number.isSafeInteger(account.walletBalanceMMK + amount)) {
        throw new StorePlatformError("This deposit would exceed the supported wallet balance.");
      }
      if (input.action === "withdraw" && account.walletBalanceMMK - (!account.bonusUnlocked ? account.signupBonusMMK : 0) < amount) {
        throw new StorePlatformError("The available wallet balance is insufficient or includes a locked signup bonus.");
      }
      account.walletBalanceMMK += input.action === "deposit" ? amount : -amount;
      data.walletEntries.unshift({
        id: `WAL-${randomUUID()}`,
        storeId: account.storeId,
        action: input.action === "deposit" ? "Deposit" : "Withdrawal",
        amountMMK: amount,
        note: (input.note ?? "").trim().slice(0, 300),
        createdAt: new Date().toISOString(),
      });
      return { ok: true };
    }
    if (input.action === "deliver") {
      const order = data.orders.find((item) => item.id === input.orderId);
      if (!order) throw new StorePlatformError("Order not found.");
      if (order.status === "Delivered") throw new StorePlatformError("This order is already marked delivered.");
      order.status = "Delivered";
      order.deliveredAt = new Date().toISOString();
      for (const item of order.items) {
        if (!item.sellerStoreId || item.costPriceMMK <= 0) continue;
        const seller = data.accounts.find((account) => account.storeId === item.sellerStoreId);
        if (!seller) continue;
        const payout = item.costPriceMMK * item.quantity + Math.round(item.costPriceMMK * item.quantity * 0.1);
        seller.walletBalanceMMK += payout;
        seller.successfulSales += item.quantity;
        if (seller.signupBonusMMK > 0) seller.bonusUnlocked = true;
        data.walletEntries.unshift({
          id: `WAL-${randomUUID()}`,
          storeId: seller.storeId,
          action: "Sale",
          amountMMK: payout,
          note: `Delivered order ${order.id}: product cost plus 10% sales profit.`,
          createdAt: new Date().toISOString(),
        });
      }
      return { ok: true };
    }
    const ticket = data.tickets.find((item) => item.id === input.ticketId);
    if (!ticket) throw new StorePlatformError("Support ticket not found.");
    if (ticket.status === "Resolved") throw new StorePlatformError("This ticket has already been resolved.");
    ticket.status = "Resolved";
    ticket.resolution = (input.note ?? "").trim().slice(0, 1000);
    ticket.resolvedAt = new Date().toISOString();
    return { ok: true };
  });
}
