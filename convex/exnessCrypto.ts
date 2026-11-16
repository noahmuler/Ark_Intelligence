"use node";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type ExnessCredentials = {
  apiKey: string;
  privateKey: string;
  accountId: string;
  discoveryBaseUrl: string;
};

export type EncryptedCredentials = {
  encryptedCredentials: string;
  iv: string;
  authTag: string;
};

function getEncryptionKey(): Buffer {
  const value = process.env.EXNESS_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!value) {
    throw new Error("EXNESS_CREDENTIALS_ENCRYPTION_KEY is not configured");
  }

  const key = /^[0-9a-f]{64}$/i.test(value)
    ? Buffer.from(value, "hex")
    : Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("EXNESS_CREDENTIALS_ENCRYPTION_KEY must encode exactly 32 bytes");
  }
  return key;
}

export function encryptCredentials(
  credentials: ExnessCredentials,
): EncryptedCredentials {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encryptedCredentials = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedCredentials: encryptedCredentials.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptCredentials(
  encrypted: EncryptedCredentials,
): ExnessCredentials {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.encryptedCredentials, "base64")),
    decipher.final(),
  ]).toString("utf8");

  const credentials: unknown = JSON.parse(plaintext);
  if (
    typeof credentials !== "object" ||
    credentials === null ||
    !("apiKey" in credentials) ||
    typeof credentials.apiKey !== "string" ||
    !("privateKey" in credentials) ||
    typeof credentials.privateKey !== "string" ||
    !("accountId" in credentials) ||
    typeof credentials.accountId !== "string" ||
    !("discoveryBaseUrl" in credentials) ||
    typeof credentials.discoveryBaseUrl !== "string"
  ) {
    throw new Error("Stored Exness credentials are invalid");
  }
  return {
    apiKey: credentials.apiKey,
    privateKey: credentials.privateKey,
    accountId: credentials.accountId,
    discoveryBaseUrl: credentials.discoveryBaseUrl,
  };
}
