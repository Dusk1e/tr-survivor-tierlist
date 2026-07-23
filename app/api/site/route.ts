import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { getSetting, setSetting } from "@/lib/store";
import { SiteConfig, SITE_VARSAYILAN } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ANAHTAR = "site";

function ayikla(ham: unknown): SiteConfig {
  const o = (ham ?? {}) as Partial<SiteConfig>;
  return {
    // Kayıt yoksa/bozuksa varsayılan AÇIK kalsın — Monarch 2 kaybolmasın.
    monarch2: typeof o.monarch2 === "boolean" ? o.monarch2 : true,
  };
}

/** Herkese açık okuma — public sayfa görünürlük ayarını buradan alır. */
export async function GET() {
  if (!cloudConfigured) return NextResponse.json(SITE_VARSAYILAN);
  try {
    const ham = await getSetting(ANAHTAR);
    if (!ham) return NextResponse.json(SITE_VARSAYILAN);
    return NextResponse.json(ayikla(JSON.parse(ham)));
  } catch {
    // Tablo yoksa ya da bozuk JSON varsa site çalışmaya devam etsin.
    return NextResponse.json(SITE_VARSAYILAN);
  }
}

/** Kaydetme — SADECE site yöneticisi. */
export async function PUT(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });

  let cfg: SiteConfig;
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
