import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  MOUSE_COOKIE,
  verifyMouseToken,
  verifySessionToken,
} from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { createMouse, listMice, mouseHasPerm } from "@/lib/store";
import { MouseInput, SlotId } from "@/lib/types";
import { SLOT_IDS } from "@/lib/tiers";
import { sanitizePerms } from "@/lib/perms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAdmin(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

function sanitize(body: any): MouseInput | null {
  if (!body) return null;
  const nickname = String(body.nickname ?? "").trim();
  const tier = String(body.tier ?? "") as SlotId;
  if (!nickname || !SLOT_IDS.includes(tier)) return null;
  return {
    nickname: nickname.slice(0, 40),
    title: String(body.title ?? "").trim().slice(0, 60),
    image_url: String(body.image_url ?? "").trim().slice(0, 2048),
    tier,
    sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0,
    username: String(body.username ?? nickname).trim().slice(0, 40),
    password: String(body.password ?? "").slice(0, 60),
    permissions: sanitizePerms(body.permissions),
    epoch: 0,
  };
}

/* GET — public roster. ?full=1 adds passwords (admin or pw_view staff). */
export async function GET(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json(
      { error: "Cloud yapılandırılmamış" },
      { status: 501 }
    );

  const wantFull = req.nextUrl.searchParams.get("full") === "1";
  let includePasswords = false;
  if (wantFull) {
    if (isAdmin(req)) includePasswords = true;
    else {
      const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
      if (tok && (await mouseHasPerm(tok.mouseId, tok.epoch, "pw_view")))
        includePasswords = true;
    }
    if (!includePasswords)
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    return NextResponse.json(await listMice(includePasswords));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Yüklenemedi" },
      { status: 500 }
    );
  }
}

/* POST — add mouse (admin or mouse_add staff). */
export async function POST(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json(
      { error: "Cloud yapılandırılmamış" },
      { status: 501 }
    );

  let authorized = isAdmin(req);
  if (!authorized) {
    const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
    authorized = !!(
      tok && (await mouseHasPerm(tok.mouseId, tok.epoch, "mouse_add"))
    );
  }
  if (!authorized)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let input: MouseInput | null = null;
  try {
    input = sanitize(await req.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!input)
    return NextResponse.json(
      { error: "Nick ve geçerli bir tier zorunlu." },
      { status: 400 }
    );

  // Only the admin can grant permissions at creation time.
  if (!isAdmin(req)) input.permissions = [];

  try {
    return NextResponse.json(await createMouse(input), { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Ekleme başarısız" },
      { status: 500 }
    );
  }
}
