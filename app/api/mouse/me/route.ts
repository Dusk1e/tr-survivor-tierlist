import { NextRequest, NextResponse } from "next/server";
import { MOUSE_COOKIE, verifyMouseToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { validMouse } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Current mouse session. The token carries the epoch it was issued at;
 * if the mouse's epoch changed since (perm/password change), the session
 * is dead and the player must log in again.
 */
export async function GET(req: NextRequest) {
  if (!cloudConfigured) return NextResponse.json({ session: null });
  const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
  if (!tok) return NextResponse.json({ session: null });
  const mouse = await validMouse(tok.mouseId, tok.epoch);
  if (!mouse) return NextResponse.json({ session: null });
  return NextResponse.json({
    session: {
      mouseId: mouse.id,
      nickname: mouse.nickname,
      epoch: mouse.epoch ?? 0,
      permissions: mouse.permissions ?? [],
    },
  });
}
