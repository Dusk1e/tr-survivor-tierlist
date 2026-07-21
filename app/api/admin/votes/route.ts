import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  MOUSE_COOKIE,
  verifyMouseToken,
  verifySessionToken,
} from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { listVotes, mouseHasPerm, purgeVotes } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET → full vote log. Admin, or staff with vote_log / vote_approve. */
export async function GET(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });

  let authorized = verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!authorized) {
    const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
    if (tok) {
      authorized =
        !!(await mouseHasPerm(tok.mouseId, tok.epoch, "vote_log")) ||
        !!(await mouseHasPerm(tok.mouseId, tok.epoch, "vote_approve"));
    }
  }
  if (!authorized)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    return NextResponse.json(await listVotes());
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Yüklenemedi" },
      { status: 500 }
    );
  }
}

/** DELETE — TÜM oyları siler. Sadece admin. */
export async function DELETE(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const silinen = await purgeVotes();
    return NextResponse.json({ ok: true, silinen });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Silinemedi" },
      { status: 500 }
    );
  }
}
