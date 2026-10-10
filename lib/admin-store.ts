import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type AdminUserRecord = {
  userId: string;
  name: string;
  phone: string;
  walletBalance: number;
  createdAt: string;
};

export type AdminTransactionRecord = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: "Deposit" | "Withdrawal";
  method: "K Pay" | "Wave Money";
  accountNumber: string;
  accountName: string;
  amount: number;
  receiptLast5?: string;
  receiptUploaded: boolean;
  receiptData?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
};

type AdminStore = {
  users: AdminUserRecord[];
  transactions: AdminTransactionRecord[];
};

const storePath = process.env.ADMIN_DATA_FILE || path.join(process.cwd(), "data", "admin-store.json");
let pendingWrite: Promise<void> = Promise.resolve();

async function readStore(): Promise<AdminStore> {
  try {
    const contents = await readFile(storePath, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "users" in parsed &&
      Array.isArray(parsed.users) &&
      "transactions" in parsed &&
      Array.isArray(parsed.transactions)
    ) {
      return parsed as AdminStore;
    }
    throw new Error("Admin data file has an invalid format.");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { users: [], transactions: [] };
    }
    throw error;
  }
}

async function writeStore(store: AdminStore) {
  const directory = path.dirname(storePath);
  await mkdir(directory, { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, storePath);
}

async function updateStore<T>(update: (store: AdminStore) => T): Promise<T> {
  let result!: T;
  const write = pendingWrite.then(async () => {
    const store = await readStore();
    result = update(store);
    await writeStore(store);
  });
  pendingWrite = write.catch((error: unknown) => {
    console.error("Unable to persist admin dashboard data.", error);
  });
  await write;
  return result;
}

export async function syncRegisteredUser(input: Omit<AdminUserRecord, "createdAt" | "walletBalance">) {
  await updateStore((store) => {
    const existing = store.users.find((user) => user.userId === input.userId);
    if (existing) {
      existing.name = input.name;
      existing.phone = input.phone;
      return;
    }
    store.users.push({ ...input, walletBalance: 0, createdAt: new Date().toISOString() });
  });
}

export async function createAdminTransaction(
  input: Omit<AdminTransactionRecord, "id" | "status" | "createdAt">,
) {
  return updateStore((store) => {
    let user = store.users.find((candidate) => candidate.userId === input.userId);
    if (!user) {
      user = {
        userId: input.userId,
        name: input.userName,
        phone: input.userPhone,
        walletBalance: 0,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
    } else {
      user.name = input.userName;
      user.phone = input.userPhone;
    }

    const transaction: AdminTransactionRecord = {
      ...input,
      id: `TX-${randomUUID()}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    store.transactions.unshift(transaction);
    return transaction;
  });
}

export async function reviewAdminTransaction(
  transactionId: string,
  decision: "Approved" | "Rejected",
  reviewNote: string,
) {
  return updateStore((store) => {
    const transaction = store.transactions.find((item) => item.id === transactionId);
    if (!transaction) return { kind: "not-found" as const };
    if (transaction.status !== "Pending") return { kind: "already-reviewed" as const };
    const user = store.users.find((item) => item.userId === transaction.userId);
    if (!user) return { kind: "user-not-found" as const };
    if (decision === "Approved" && transaction.type === "Withdrawal" && user.walletBalance < transaction.amount) {
      return { kind: "insufficient-balance" as const };
    }

    transaction.status = decision;
    transaction.reviewedAt = new Date().toISOString();
    transaction.reviewNote = reviewNote;
    if (decision === "Approved") {
      user.walletBalance += transaction.type === "Deposit" ? transaction.amount : -transaction.amount;
    }
    return { kind: "ok" as const, transaction, walletBalance: user.walletBalance };
  });
}

export async function getAdminReceipt(transactionId: string) {
  await pendingWrite;
  const store = await readStore();
  const transaction = store.transactions.find((item) => item.id === transactionId);
  return transaction?.receiptData ?? null;
}

export async function getAdminUserBalance(userId: string) {
  await pendingWrite;
  const store = await readStore();
  return store.users.find((user) => user.userId === userId)?.walletBalance ?? null;
}

export async function listAdminData() {
  await pendingWrite;
  const store = await readStore();
  const users = store.users.map(({ userId, name, phone, walletBalance, createdAt }) => ({
    userId,
    name,
    phone,
    walletBalance,
    createdAt,
  }));
  const transactions = store.transactions.map((transaction) => {
    const safeTransaction = { ...transaction };
    delete safeTransaction.receiptData;
    return safeTransaction;
  });
  return {
    users,
    pending: transactions.filter((transaction) => transaction.status === "Pending"),
    history: transactions.filter((transaction) => transaction.status !== "Pending"),
  };
}
