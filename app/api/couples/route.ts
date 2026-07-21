import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { clearCouple, setCouple } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Aşk Köşesi eşleştirmesi — SADECE site yöneticisi. */
function adminMi(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

/** POST {a, b, tasi} — iki fareyi çift yapar. */
export async function POST(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!adminMi(req))
    return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });

  let a = "";
  let b = "";
  let tasi = true;
  try {
    const body = await req.json();
    a = String(body?.a ?? "");
    b = String(body?.b ?? "");
    tasi = body?.tasi !== false;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    await setCouple(a, b, tasi);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Eşleştirilemedi" },
      { status: 500 }
    );
  }
}

/** DELETE {id} — çifti ayırır (iki taraftan da). */
export async function DELETE(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!adminMi(req))
    return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });

  let id = "";
  try {
    const body = await req.json();
    id = String(body?.id ?? "");
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "Fare seçilmeli" }, { status: 400 });

  try {
    await clearCouple(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Ayrılamadı" },
      { status: 500 }
    );
  }
}
