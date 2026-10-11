import { setAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/request-origin";

const attempts = new Map<string, { count: number; expiresAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(request: Request) {
  const client = request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const now = Date.now();
  const attempt = attempts.get(client);
  if (attempt && attempt.expiresAt > now && attempt.count >= MAX_ATTEMPTS) return true;
  if (attempts.size > 2000) {
    for (const [key, value] of attempts) {
      if (value.expiresAt <= now) attempts.delete(key);
    }
  }
  return false;
}

function recordFailedAttempt(request: Request) {
  const client = request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const now = Date.now();
  const current = attempts.get(client);
  if (!current || current.expiresAt <= now) {
    attempts.set(client, { count: 1, expiresAt: now + WINDOW_MS });
  } else {
    current.count += 1;
  }
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
    typeof body !== "object" ||
    body === null ||
    !("phone" in body) ||
    typeof body.phone !== "string" ||
    !("password" in body) ||
    typeof body.password !== "string"
  ) {
    return Response.json({ error: "Enter an admin phone number and password." }, { status: 400 });
  }
  if (!verifyAdminCredentials(body.phone, body.password)) {
    recordFailedAttempt(request);
    return Response.json({ error: "The admin credentials are incorrect." }, { status: 401 });
  }
  try {
    await setAdminSession();
  } catch (error) {
    console.error("Unable to create an admin session.", error);
    return Response.json({ error: "Admin session is not configured on the server." }, { status: 503 });
  }
  return Response.json({ ok: true });
}
