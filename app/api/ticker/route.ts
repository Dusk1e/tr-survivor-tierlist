import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { getSetting, setSetting } from "@/lib/store";
import { TickerConfig, TICKER_VARSAYILAN } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANAHTAR = "ticker";

function ayikla(ham: unknown): TickerConfig {
  const o = (ham ?? {}) as Partial<TickerConfig>;
  const hiz = Number(o.hiz);
  return {
    aktif: Boolean(o.aktif),
    metin: String(o.metin ?? "").slice(0, 500),
    // 10 sn = çok hızlı, 120 sn = çok yavaş. Aralık dışı değerler kırpılır.
    hiz: Number.isFinite(hiz) ? Math.min(120, Math.max(10, hiz)) : 40,
  };
}

/** Herkese açık okuma — banttaki yazıyı site gösterir. */
export async function GET() {
  if (!cloudConfigured) return NextResponse.json(TICKER_VARSAYILAN);
  try {
    const ham = await getSetting(ANAHTAR);
    if (!ham) return NextResponse.json(TICKER_VARSAYILAN);
    return NextResponse.json(ayikla(JSON.parse(ham)));
  } catch {
    // Tablo yoksa ya da bozuk JSON varsa site çalışmaya devam etsin —
    // bant sadece görünmez olur.
    return NextResponse.json(TICKER_VARSAYILAN);
  }
}

/** Kaydetme — SADECE site yöneticisi. */
export async function PUT(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });

  let cfg: TickerConfig;
  try {
    cfg = ayikla(await req.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    await setSetting(ANAHTAR, JSON.stringify(cfg));
    return NextResponse.json(cfg);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Kaydedilemedi" },
      { status: 500 }
    );
  }
}
