import crypto from "crypto";

/**
 * Hashes a plaintext password using PBKDF2-HMAC-SHA512 with a cryptographically
 * secure 16-byte random salt and 100,000 iterations.
 *
 * Stored format: <salt_hex>:<iterations>:<hash_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const keylen = 64;
  const digest = "sha512";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash using
 * constant-time comparison to prevent timing side-channel attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!password || !storedHash) return false;
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;

    const [salt, iterStr, hash] = parts;
    const iterations = parseInt(iterStr, 10);
    if (isNaN(iterations) || iterations < 1000) return false;

    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}
