import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "evergreen-admin-session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("95")) return `0${digits.slice(2)}`;
  return digits;
}

export function verifyAdminCredentials(phone: string, password: string) {
  const configuredPhone = process.env.ADMIN_PHONE;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPhone || !configuredPassword) return false;
  const expectedPhone = normalizePhone(configuredPhone);
  const suppliedPhone = normalizePhone(phone);
  const phoneMatches = expectedPhone.length === suppliedPhone.length &&
    timingSafeEqual(Buffer.from(expectedPhone), Buffer.from(suppliedPhone));
  const passwordMatches = Buffer.byteLength(configuredPassword) === Buffer.byteLength(password) &&
    timingSafeEqual(Buffer.from(configuredPassword), Buffer.from(password));
  return phoneMatches && passwordMatches;
}

export async function setAdminSession() {
  const issuedAt = Date.now();
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedAtText, nonce, signature] = parts;
  const issuedAt = Number(issuedAtText);
  if (!Number.isSafeInteger(issuedAt) || !nonce || !signature) return false;
  const age = Date.now() - issuedAt;
  if (age < 0 || age > SESSION_DURATION_SECONDS * 1000) return false;
  const payload = `${issuedAtText}.${nonce}`;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
