import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  MOUSE_COOKIE,
  verifyMouseToken,
  verifySessionToken,
} from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { deleteMouse, mouseHasPerm, updateMouse } from "@/lib/store";
import { MouseInput, SlotId } from "@/lib/types";
import { SLOT_IDS } from "@/lib/tiers";
import { sanitizePerms } from "@/lib/perms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

function sanitizePatch(body: any): Partial<MouseInput> {
  const patch: Partial<MouseInput> = {};
  if (typeof body?.nickname === "string")
    patch.nickname = body.nickname.trim().slice(0, 40);
  if (typeof body?.title === "string")
    patch.title = body.title.trim().slice(0, 60);
  if (typeof body?.image_url === "string")
    patch.image_url = body.image_url.trim().slice(0, 2048);
  if (typeof body?.tier === "string" && SLOT_IDS.includes(body.tier as SlotId))
    patch.tier = body.tier as SlotId;
  if (Number.isFinite(Number(body?.sort))) patch.sort = Number(body.sort);
  if (typeof body?.username === "string")
    patch.username = body.username.trim().slice(0, 40);
  // BOŞ şifre "değiştirme" sayılmaz, "sil" hiç sayılmaz. Form şifreyi
  // yükleyememişse boş gönderiyordu ve gerçek şifreyi eziyordu — hesap
  // giriş yapılamaz hâle geliyordu. Boş gelen şifre artık yok sayılır.
  if (typeof body?.password === "string" && body.password.trim().length > 0)
    patch.password = body.password.slice(0, 60);
  if (body?.permissions !== undefined)
    patch.permissions = sanitizePerms(body.permissions);
  return patch;
}

/**
 * PATCH — field-level authorization:
 *  - admin: everything (incl. permissions)
 *  - staff w/ tier_edit: tier, sort, nickname, title, image_url, username
 *  - staff w/ pw_edit: password
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });

  let patch: Partial<MouseInput>;
  try {
    patch = sanitizePatch(await req.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Değişiklik yok" }, { status: 400 });

  if (!isAdmin(req)) {
    const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
    if (!tok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    if (patch.permissions !== undefined)
      return NextResponse.json(
        { error: "Yetkileri sadece admin değiştirebilir." },
        { status: 403 }
      );

    const wantsPw = patch.password !== undefined;
    const wantsProfile = Object.keys(patch).some((k) => k !== "password");

    if (wantsPw && !(await mouseHasPerm(tok.mouseId, tok.epoch, "pw_edit")))
      return NextResponse.json({ error: "Şifre yetkin yok." }, { status: 403 });
    if (
      wantsProfile &&
      !(await mouseHasPerm(tok.mouseId, tok.epoch, "tier_edit"))
    )
      return NextResponse.json(
        { error: "Tierlist düzenleme yetkin yok." },
        { status: 403 }
      );
  }

  try {
    return NextResponse.json(await updateMouse(params.id, patch));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}

/* DELETE — admin only. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });
  if (!isAdmin(req))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    await deleteMouse(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Silme başarısız" },
      { status: 500 }
    );
  }
}
