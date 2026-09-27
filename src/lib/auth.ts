import type { NextRequest } from "next/server";

// Web Crypto API based HMAC session token for Next.js Node and Edge runtime
const COOKIE_NAME = "vst_admin_session";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(byte)) return null;
    bytes[i / 2] = byte;
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a signed session token.
 * FAILS CLOSED: Throws an error if AUTH_SECRET is not configured in env.
 */
export async function createSessionToken(username: string): Promise<string> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured in environment variables");
  }

  const enc = new TextEncoder();
  const key = await getHmacKey(secret);

  const payload = {
    sub: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = btoa(payloadJson);

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(payloadB64)
  );
  const signatureHex = bufferToHex(signatureBuffer);

  return `${payloadB64}.${signatureHex}`;
}

/**
 * Verifies a session token.
 * FAILS CLOSED: Returns { valid: false } if AUTH_SECRET is not configured or token is invalid.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; username?: string }> {
  if (!token) return { valid: false };

  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return { valid: false };
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, providedSigHex] = parts;
    const providedSigBytes = hexToBytes(providedSigHex);
    if (!providedSigBytes) return { valid: false };

    const enc = new TextEncoder();
    const key = await getHmacKey(secret);

    const expectedSigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(payloadB64)
    );
    const expectedSigBytes = new Uint8Array(expectedSigBuffer);

    if (!constantTimeEqual(providedSigBytes, expectedSigBytes)) {
      return { valid: false };
    }

    const payloadJson = atob(payloadB64);
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return { valid: false };
    }

    return { valid: true, username: payload.sub };
  } catch {
    return { valid: false };
  }
}

/**
 * Helper to verify authentication on an incoming NextRequest.
 */
export async function verifyAuthRequest(
  req: NextRequest
): Promise<{ valid: boolean; username?: string }> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export { COOKIE_NAME, TOKEN_TTL_SECONDS };
