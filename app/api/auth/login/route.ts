import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken, getAdminPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sertleştirilmiş admin girişi:
 *  - her denemede sabit gecikme (timing sızıntısını ve brute-force hızını keser)
 *  - IP başına 5 hatalı deneme → 5 dakika kilit
 *  - sabit-zamanlı karşılaştırma (sha256 + timingSafeEqual)
 *  - genel hata mesajı (şifre mi yanlış, hesap mı yok belli olmaz)
 *  - production'da ENV şifresi zorunlu
 */

const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000;
const attempts = new Map<string, { fails: number; lockedUntil: number }>();

function ipOf(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

function safeCompare(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  const ip = ipOf(req);
  const now = Date.now();
  const rec = attempts.get(ip);

  if (rec && rec.lockedUntil > now) {
    const mins = Math.ceil((rec.lockedUntil - now) / 60000);
    return NextResponse.json(
      { error: `Çok fazla deneme. ${mins} dk sonra tekrar dene.` },
      { status: 429 }
    );
  }

  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  // Her denemeyi yavaşlat.
  await new Promise((r) => setTimeout(r, 800));

  const expected = getAdminPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "Yönetici girişi bu sunucuda yapılandırılmamış." },
      { status: 503 }
    );
  }

  if (!password || !safeCompare(password, expected)) {
    const fails = (rec?.fails ?? 0) + 1;
    attempts.set(ip, {
      fails,
      lockedUntil: fails >= MAX_FAILS ? now + LOCK_MS : 0,
    });
    return NextResponse.json({ error: "Giriş başarısız." }, { status: 401 });
  }

  attempts.delete(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
