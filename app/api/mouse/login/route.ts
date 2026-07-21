import { NextRequest, NextResponse } from "next/server";
import { MOUSE_COOKIE, createMouseToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { findMouseByCredentials } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });

  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = String(body?.username ?? "");
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  await new Promise((r) => setTimeout(r, 300));
  const mouse = await findMouseByCredentials(username, password);
  if (!mouse) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  const res = NextResponse.json({
    mouseId: mouse.id,
    nickname: mouse.nickname,
    epoch: mouse.epoch ?? 0,
    permissions: mouse.permissions ?? [],
  });
  res.cookies.set(MOUSE_COOKIE, createMouseToken(mouse.id, mouse.epoch ?? 0), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
