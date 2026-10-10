import { createAdminTransaction, getAdminUserBalance } from "@/lib/admin-store";

const requestTimes = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_RECEIPT_BYTES + 1024 * 1024;
const RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const TELEGRAM_RETRY_LIMIT = 3;
const DEFAULT_ADMIN_CHAT_ID = "8074618542";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isRateLimited(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const client = request.headers.get("x-real-ip") || forwardedFor?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (requestTimes.get(client) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestTimes.set(client, recent);
    return true;
  }
  requestTimes.set(client, [...recent, now]);
  if (requestTimes.size > 2000) {
    for (const [key, timestamps] of requestTimes) {
      if (timestamps.every((time) => now - time >= RATE_WINDOW_MS)) requestTimes.delete(key);
    }
  }
  return false;
}

function validText(value: FormDataEntryValue | null, maximumLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").trim().slice(0, maximumLength)
    : "";
}

function isTransactionType(value: string): value is "Deposit" | "Withdrawal" {
  return value === "Deposit" || value === "Withdrawal";
}

function isPaymentMethod(value: string): value is "K Pay" | "Wave Money" {
  return value === "K Pay" || value === "Wave Money";
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("wallet.error.origin", 403);
  if (isRateLimited(request)) return jsonError("wallet.error.rateLimit", 429);
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonError("wallet.error.invalidReceiptFile", 413);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || DEFAULT_ADMIN_CHAT_ID;
  if (!botToken) return jsonError("wallet.error.telegramConfig", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("wallet.error.invalidRequest", 400);
  }

  const transactionType = validText(form.get("type"), 20);
  const method = validText(form.get("method"), 30);
  const accountNumber = validText(form.get("accountNumber"), 64);
  const accountName = validText(form.get("accountName"), 120);
  const amount = validText(form.get("amount"), 16);
  const userId = validText(form.get("userId"), 32);
  const userName = validText(form.get("userName"), 120);
  const userPhone = validText(form.get("userPhone"), 24);
  const receiptLast5 = validText(form.get("receiptLast5"), 5);
  const receiptValue = form.get("receipt");
  const receipt = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null;

  if (!isTransactionType(transactionType) || !isPaymentMethod(method)) {
    return jsonError("wallet.error.invalidRequest", 400);
  }
  if (!accountNumber || !/^[\d+\-\s()]{5,64}$/.test(accountNumber) || !accountName || !userId || !userName || !userPhone) {
    return jsonError("wallet.error.invalidAccount", 400);
  }
  if (!/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) {
    return jsonError("wallet.error.invalidAmount", 400);
  }
  if (receiptLast5 && !/^\d{5}$/.test(receiptLast5)) {
    return jsonError("wallet.error.invalidReceiptDigits", 400);
  }
  if (!receipt && !/^\d{5}$/.test(receiptLast5)) {
    return jsonError("wallet.error.receiptRequired", 400);
  }
  if (receipt && (receipt.size > MAX_RECEIPT_BYTES || !RECEIPT_TYPES.has(receipt.type))) {
    return jsonError("wallet.error.invalidReceiptFile", 400);
  }
  if (transactionType === "Withdrawal") {
    const walletBalance = await getAdminUserBalance(userId);
    if (walletBalance === null || Number(amount) > walletBalance) {
      return jsonError("account.error.withdrawalBalance", 400);
    }
  }

  const amountLabel = `${Number(amount).toLocaleString("en-US")} MMK`;
  const details = [
    "Evergreen wallet request",
    `Type: ${transactionType}`,
    `User: ${userName} (${userId})`,
    `Phone: ${userPhone}`,
    `Payment method: ${method}`,
    `Account name: ${accountName}`,
    `Account number: ${accountNumber}`,
    `Amount: ${amountLabel}`,
    receiptLast5 ? `Receipt last 5 digits: ${receiptLast5}` : "Receipt: attached",
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");

  const endpoint = `https://api.telegram.org/bot${botToken}/${receipt ? "sendDocument" : "sendMessage"}`;
  let lastStatus: number | undefined;
  let lastDescription = "No response was returned.";
  for (let attempt = 0; attempt < TELEGRAM_RETRY_LIMIT; attempt += 1) {
    let telegramResponse: Response;
    try {
      const requestInit: RequestInit = receipt
        ? (() => {
            const telegramForm = new FormData();
            telegramForm.set("chat_id", adminChatId);
            telegramForm.set("caption", details);
            const extension = receipt.type === "application/pdf" ? "pdf" : receipt.type.split("/")[1];
            telegramForm.set("document", receipt, `wallet-receipt.${extension}`);
            return { method: "POST", body: telegramForm, signal: AbortSignal.timeout(10_000), cache: "no-store" };
          })()
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: adminChatId, text: details }),
            signal: AbortSignal.timeout(10_000),
            cache: "no-store",
          };
      telegramResponse = await fetch(endpoint, requestInit);
    } catch {
      lastDescription = "Telegram request failed before a response was received.";
      if (attempt + 1 < TELEGRAM_RETRY_LIMIT) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      return jsonError("wallet.error.telegramUnavailable", 502);
    }

    lastStatus = telegramResponse.status;
    let telegramPayload: unknown;
    try {
      telegramPayload = await telegramResponse.json();
    } catch {
      lastDescription = "Telegram returned an unreadable response.";
      if (telegramResponse.status >= 500 && attempt + 1 < TELEGRAM_RETRY_LIMIT) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      return jsonError("wallet.error.telegramUnavailable", 502);
    }
    if (
      typeof telegramPayload !== "object" ||
      telegramPayload === null ||
      !("ok" in telegramPayload) ||
      typeof telegramPayload.ok !== "boolean"
    ) {
      lastDescription = "Telegram returned an invalid response.";
      if (telegramResponse.status >= 500 && attempt + 1 < TELEGRAM_RETRY_LIMIT) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      return jsonError("wallet.error.telegramUnavailable", 502);
    }
    if (telegramResponse.ok && telegramPayload.ok) {
      try {
        const transaction = await createAdminTransaction({
          userId,
          userName,
          userPhone,
          type: transactionType,
          method,
          accountNumber,
          accountName,
          amount: Number(amount),
          receiptLast5: receiptLast5 || undefined,
          receiptUploaded: Boolean(receipt),
          receiptData: receipt
            ? `data:${receipt.type};base64,${Buffer.from(await receipt.arrayBuffer()).toString("base64")}`
            : undefined,
        });
        return Response.json({ ok: true, transactionId: transaction.id });
      } catch (error) {
        console.error("Telegram accepted a wallet notification, but the pending transaction could not be saved.", error);
        return jsonError("wallet.error.telegramUnavailable", 503);
      }
    }

    lastDescription = "description" in telegramPayload && typeof telegramPayload.description === "string"
      ? telegramPayload.description
      : "No error description was returned.";
    const retryable = telegramResponse.status === 429 || telegramResponse.status >= 500;
    if (retryable && attempt + 1 < TELEGRAM_RETRY_LIMIT) {
      const retryAfter = "parameters" in telegramPayload &&
        typeof telegramPayload.parameters === "object" &&
        telegramPayload.parameters !== null &&
        "retry_after" in telegramPayload.parameters &&
        typeof telegramPayload.parameters.retry_after === "number"
        ? telegramPayload.parameters.retry_after
        : 0;
      const waitMs = retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 500 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }
    break;
  }

  console.error("Telegram rejected a wallet notification.", {
    status: lastStatus,
    description: lastDescription,
  });
  return jsonError("wallet.error.telegramRejected", 502);
}
