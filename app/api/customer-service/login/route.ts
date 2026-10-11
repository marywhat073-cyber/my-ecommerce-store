import { setCustomerServiceSession, verifyCustomerServiceCredentials } from "@/lib/customer-service-auth";
import { isSameOrigin } from "@/lib/request-origin";

const attempts = new Map<string, { count: number; expiresAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function clientKey(request: Request) {
  return request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function isRateLimited(request: Request) {
  const key = clientKey(request);
  const attempt = attempts.get(key);
  const now = Date.now();
  if (attempt && attempt.expiresAt > now && attempt.count >= MAX_ATTEMPTS) return true;
  if (attempts.size > 2000) {
    for (const [client, value] of attempts) if (value.expiresAt <= now) attempts.delete(client);
  }
  return false;
}

function recordFailedAttempt(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.expiresAt <= now) attempts.set(key, { count: 1, expiresAt: now + WINDOW_MS });
  else current.count += 1;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  if (isRateLimited(request)) return Response.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (
    typeof body !== "object" || body === null ||
    !("phone" in body) || typeof body.phone !== "string" ||
    !("password" in body) || typeof body.password !== "string"
  ) return Response.json({ error: "Enter the staff phone number and password." }, { status: 400 });
  if (!verifyCustomerServiceCredentials(body.phone, body.password)) {
    recordFailedAttempt(request);
    return Response.json({ error: "The staff credentials are incorrect." }, { status: 401 });
  }
  try {
    await setCustomerServiceSession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to create a customer-service session.", error);
    return Response.json({ error: "Customer-service sign-in is not configured on this server." }, { status: 503 });
  }
}
