import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  MOUSE_COOKIE,
  verifyMouseToken,
  verifySessionToken,
} from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import {
  decideVote,
  deleteVote,
  getVote,
  mouseHasPerm,
  validMouse,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* PATCH {action: approve|reject} — admin or staff with vote_approve. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });

  let decider = "";
  if (verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    decider = "Admin";
  } else {
    const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
    const staff =
      tok && (await mouseHasPerm(tok.mouseId, tok.epoch, "vote_approve"));
    if (!staff)
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    decider = staff.nickname;
  }

  let action = "";
  try {
    const body = await req.json();
    action = String(body?.action ?? "");
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject")
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });

  try {
    await decideVote(params.id, action, decider);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "İşlem başarısız" },
      { status: 500 }
    );
  }
}

/**
 * DELETE — iki ayrı yetki:
 *  1) SADECE site yöneticisi (admin oturumu) her oyu silebilir, onaylanmış
 *     olanlar dahil. Kayıt defterindeki "Sil" düğmesi bunu kullanır.
 *     Yetkili personel — "oy onaylama" yetkisi olsa bile — SİLEMEZ;
 *     onaylayıp reddedebilir ama kaydı yok edemez.
 *  2) Oyun sahibi kendi oyunu sadece HENÜZ ONAYLANMAMIŞKEN iptal edebilir;
 *     onaylanan puan sahibi için kilitlidir.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });

  const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);

  // 1) Yalnızca admin — sınırsız silme.
  if (verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    if (!(await getVote(params.id)))
      return NextResponse.json({ error: "Kayıt yok" }, { status: 404 });
    try {
      await deleteVote(params.id);
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "Silinemedi" },
        { status: 500 }
      );
    }
  }

  // 2) Kendi oyunu iptal etme.
  if (!tok) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const me = await validMouse(tok.mouseId, tok.epoch);
  if (!me)
    return NextResponse.json(
      { error: "Oturumun geçersiz — tekrar giriş yap." },
      { status: 401 }
    );

  const vote = await getVote(params.id);
  if (!vote) return NextResponse.json({ error: "Kayıt yok" }, { status: 404 });
  if (vote.voter_id !== me.id)
    return NextResponse.json({ error: "Bu senin puanın değil" }, { status: 403 });
  if (vote.status === "approved")
    return NextResponse.json(
      { error: "Onaylanmış puan iptal edilemez." },
      { status: 400 }
    );

  try {
    await deleteVote(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "İptal edilemedi" },
      { status: 500 }
    );
  }
}
