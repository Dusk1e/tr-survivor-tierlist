import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { addAuthority, listAuthorities, removeAuthority } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function yetkiliMi(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

async function isimAl(req: NextRequest): Promise<string | null> {
  try {
    const body = await req.json();
    const n = String(body?.name ?? "").trim();
    return n || null;
  } catch {
    return null;
  }
}

/** Herkese açık okuma. */
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

/**
 * TEK isim ekle. Güncel listeyi döner, böylece panelin ayrıca okuma
 * yapmasına gerek kalmaz — yarış durumu ihtimali tamamen ortadan kalkar.
 *
 * Eski PUT (tüm listeyi gönder, eksikleri sil) kaldırıldı: panelin listesi
 * bir an eksik olduğunda yeni eklenen isim kendi kendine siliniyordu.
 */
export async function POST(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!yetkiliMi(req))
    return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });

  const name = await isimAl(req);
  if (!name)
    return NextResponse.json({ error: "İsim boş olamaz" }, { status: 400 });

  try {
    return NextResponse.json(await addAuthority(name));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Eklenemedi" },
      { status: 500 }
    );
  }
}

/** TEK isim sil. Güncel listeyi döner. */
export async function DELETE(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!yetkiliMi(req))
    return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });

  const name = await isimAl(req);
  if (!name)
    return NextResponse.json({ error: "İsim boş olamaz" }, { status: 400 });

  try {
    return NextResponse.json(await removeAuthority(name));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Silinemedi" },
      { status: 500 }
    );
  }
}
