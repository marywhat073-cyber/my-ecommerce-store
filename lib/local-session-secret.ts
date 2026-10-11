import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type LocalSecretName = "store" | "customer-service";

const secretFileNames: Record<LocalSecretName, string> = {
  store: ".store-session-secret",
  "customer-service": ".customer-service-session-secret",
};

export async function getSessionSecret(environmentName: string, localName: LocalSecretName) {
  const configuredSecret = process.env[environmentName];
  if (configuredSecret !== undefined) {
    if (configuredSecret.length < 32) {
      throw new Error(`${environmentName} must contain at least 32 characters.`);
    }
    return configuredSecret;
  }

  const dataDirectory = path.join(process.cwd(), "data");
  const secretPath = path.join(dataDirectory, secretFileNames[localName]);

  try {
    return await readLocalSecret(secretPath);
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }

  await mkdir(dataDirectory, { recursive: true });
  const generatedSecret = randomBytes(32).toString("base64url");
  try {
    await writeFile(secretPath, generatedSecret, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return generatedSecret;
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    return readLocalSecret(secretPath);
  }
}

async function readLocalSecret(secretPath: string) {
  const secret = (await readFile(secretPath, "utf8")).trim();
  if (secret.length < 32) throw new Error(`The local session secret at ${secretPath} is invalid.`);
  return secret;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isAlreadyExists(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}
