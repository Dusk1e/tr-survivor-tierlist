import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { listAuthorities, setAuthorities } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!cloudConfigured) return NextResponse.json([]);
  try {
    return NextResponse.json(await listAuthorities());
  } catch (e: any) {
    // Hatayı YUTMA — eskiden boş liste dönüyordu ve "yetkililer silindi"
    // gibi görünüyordu. Artık gerçek sebep görünür.
    return NextResponse.json(
      { error: e?.message ?? "Yetkililer okunamadı" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud not configured" }, { status: 501 });
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let list: string[] = [];
  try {
    const body = await req.json();
    list = Array.isArray(body?.list)
      ? body.list.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 50)
      : [];
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    await setAuthorities(list);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Hata" }, { status: 500 });
  }
}
