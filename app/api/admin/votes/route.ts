import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  MOUSE_COOKIE,
  verifyMouseToken,
  verifySessionToken,
} from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import {
  listVotes,
  mouseHasPerm,
  oyYedegiBilgisi,
  purgeVotes,
  restoreVotes,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    // ?yedek=1 → oy listesi yerine "geri alınabilir yedek var mı" bilgisi
    if (new URL(req.url).searchParams.get("yedek") === "1") {
      return NextResponse.json({ yedek: await oyYedegiBilgisi() });
    }
    return NextResponse.json(await listVotes());
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Yüklenemedi" },
      { status: 500 }
    );
  }
}

/** POST {action:"geriAl"} — son sıfırlamayı geri alır. Sadece admin. */
export async function POST(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let action = "";
  try {
    action = String((await req.json())?.action ?? "");
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (action !== "geriAl")
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });

  try {
    return NextResponse.json({ ok: true, ...(await restoreVotes()) });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Geri alınamadı" },
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
