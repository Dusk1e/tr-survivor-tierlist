import crypto from "crypto";

/**
 * Minimal, dependency-free sessions using HMAC-signed cookies.
 *  - Admin: password (env) -> signed httpOnly cookie.
 *  - Mouse: username+password -> signed httpOnly cookie carrying id + epoch.
 *    The epoch is compared against the DB row on every check, so bumping a
 *    mouse's epoch (perm/password change) force-logs-out all its sessions.
 */

export const ADMIN_COOKIE = "tst_admin";
export const MOUSE_COOKIE = "tst_mouse";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    // Fallback keeps demo mode working; override in production via env.
    "tr-survivor-tierlist-dev-secret-change-me"
  );
}

/**
 * Admin password. Önce ortam değişkeni (.env.local / Vercel env) okunur;
 * production'da env ZORUNLU — yoksa panel tamamen kilitli kalır.
 */
export function getAdminPassword(): string | null {
  const env = process.env.ADMIN_PASSWORD;
  if (env && env.length > 0) return env;
  return process.env.NODE_ENV === "production" ? null : "ysfcan25070200";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/* ------------------------------ admin ---------------------------------- */

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  return `${exp}.${sign(`admin:${exp}`)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expStr, mac] = token.split(".");
  if (!expStr || !mac) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(mac, sign(`admin:${exp}`));
}

/* ------------------------------ mouse ----------------------------------- */

export function createMouseToken(mouseId: string, epoch: number): string {
  const exp = Date.now() + SESSION_TTL_MS;
  return `${mouseId}.${epoch}.${exp}.${sign(`mouse:${mouseId}:${epoch}:${exp}`)}`;
}

/** Returns {mouseId, epoch} when valid & unexpired, else null. */
export function verifyMouseToken(
  token: string | undefined | null
): { mouseId: string; epoch: number } | null {
  if (!token) return null;
  const [mouseId, epochStr, expStr, mac] = token.split(".");
  if (!mouseId || !epochStr || !expStr || !mac) return null;
  const exp = Number(expStr);
  const epoch = Number(epochStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  if (!Number.isFinite(epoch)) return null;
  if (!safeEqual(mac, sign(`mouse:${mouseId}:${epoch}:${exp}`))) return null;
  return { mouseId, epoch };
}
