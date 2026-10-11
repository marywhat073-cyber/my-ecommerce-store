import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "evergreen-store-session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function hasValidStoreSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.STORE_SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [storeId, issuedAtText, nonce, signature] = parts;
  const issuedAt = Number(issuedAtText);
  if (!/^STORE-[A-F0-9]{12}$/.test(storeId) || !Number.isSafeInteger(issuedAt) || !nonce || !signature) return false;
  const age = Date.now() - issuedAt;
  if (age < 0 || age > SESSION_SECONDS * 1000) return false;
  const payload = `${storeId}.${issuedAtText}.${nonce}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(signature);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/customer-service-office") return NextResponse.next();
  if (hasValidStoreSession(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
