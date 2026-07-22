import { NextResponse } from "next/server";
import { MOUSE_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOUSE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
