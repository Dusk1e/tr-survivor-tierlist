import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  MOUSE_COOKIE,
  verifyMouseToken,
  verifySessionToken,
} from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { decideVote, mouseHasPerm } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
