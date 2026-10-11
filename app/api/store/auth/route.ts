import { isSameOrigin } from "@/lib/request-origin";
import {
  clearStoreSession,
  finishRegistrationSession,
  getCurrentStore,
  loginStore,
  registerStore,
  StorePlatformError,
} from "@/lib/store-platform";

const authAttempts = new Map<string, { count: number; expiresAt: number }>();

function getAttemptKey(request: Request, action: string) {
  const ip = request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `${action}:${ip}`;
}

function rateLimited(request: Request, action: string, limit: number) {
  const key = getAttemptKey(request, action);
  const current = authAttempts.get(key);
  const now = Date.now();
  if (current && current.expiresAt > now && current.count >= limit) return true;
  if (authAttempts.size > 2000) {
    for (const [candidate, value] of authAttempts) if (value.expiresAt <= now) authAttempts.delete(candidate);
  }
  return false;
}

function recordAttempt(request: Request, action: string) {
  const key = getAttemptKey(request, action);
  const now = Date.now();
  const current = authAttempts.get(key);
  if (!current || current.expiresAt <= now) authAttempts.set(key, { count: 1, expiresAt: now + 15 * 60 * 1000 });
  else current.count += 1;
}

export async function GET() {
  try {
    return Response.json({ store: await getCurrentStore() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load the current store session.", error);
    return Response.json({ error: "Unable to load the store account." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("action" in body) || typeof body.action !== "string") {
    return Response.json({ error: "Choose registration or sign-in." }, { status: 400 });
  }
  if (body.action === "register" && rateLimited(request, "register", 10)) {
    return Response.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
  }
  if (body.action === "login" && rateLimited(request, "login", 8)) {
    return Response.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  }
  if (body.action === "register") recordAttempt(request, "register");
  try {
    if (body.action === "login" && "phone" in body && typeof body.phone === "string" && "password" in body && typeof body.password === "string") {
      const store = await loginStore(body.phone, body.password);
      if (!store) {
        recordAttempt(request, "login");
        return Response.json({ error: "Phone number or password is incorrect." }, { status: 401 });
      }
      authAttempts.delete(getAttemptKey(request, "login"));
      return Response.json({ store });
    }
    if (
      body.action === "register" &&
      "phone" in body && typeof body.phone === "string" &&
      "storeName" in body && typeof body.storeName === "string" &&
      "storeAddress" in body && typeof body.storeAddress === "string" &&
      "password" in body && typeof body.password === "string" &&
      "invitationCode" in body && typeof body.invitationCode === "string"
    ) {
      const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const store = await registerStore({
        phone: body.phone,
        storeName: body.storeName,
        storeAddress: body.storeAddress,
        password: body.password,
        invitationCode: body.invitationCode,
        registrationIp: request.headers.get("x-real-ip") || forwarded || "unknown",
      });
      await finishRegistrationSession(store.storeId);
      return Response.json({ store }, { status: 201 });
    }
    return Response.json({ error: "Enter all required store account details." }, { status: 400 });
  } catch (error) {
    if (error instanceof StorePlatformError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof Error && error.message.startsWith("STORE_SESSION_SECRET")) {
      console.error("Store session secret configuration is invalid.", error);
      return Response.json({ error: "Store session configuration is invalid. Set STORE_SESSION_SECRET to at least 32 characters or remove it to use the local server key." }, { status: 503 });
    }
    console.error("Unable to process store account request.", error);
    return Response.json({ error: "Unable to process store account request." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  try {
    await clearStoreSession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to clear the store session.", error);
    return Response.json({ error: "Unable to sign out." }, { status: 500 });
  }
}
