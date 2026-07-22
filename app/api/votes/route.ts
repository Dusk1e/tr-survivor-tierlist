import { NextRequest, NextResponse } from "next/server";
import { MOUSE_COOKIE, verifyMouseToken } from "@/lib/auth";
import { cloudConfigured } from "@/lib/supabase";
import { listMice, listVotes, submitVote, validMouse } from "@/lib/store";
import { aggregateVotes } from "@/lib/aggregate";
import { sanitizeScores } from "@/lib/dims";
import { MyVote } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* GET → public aggregates (approved-only, weighted) + caller's own votes. */
export async function GET(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ agg: {}, mine: {}, totalApproved: 0 });

  try {
    const [votes, mice] = await Promise.all([listVotes(), listMice(true)]);
    const agg = aggregateVotes(votes, mice);
    const totalApproved = votes.filter((v) => v.status === "approved").length;

    const mine: Record<string, MyVote> = {};
    const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
    if (tok) {
      const me = await validMouse(tok.mouseId, tok.epoch);
      if (me) {
        for (const v of votes) {
          if (v.voter_id === me.id)
            mine[v.target_id] = {
              id: v.id,
              status: v.status,
              scores: v.scores,
              hotkey: v.hotkey,
            };
        }
      }
    }
    return NextResponse.json({ agg, mine, totalApproved });
  } catch (e: any) {
    return NextResponse.json({ agg: {}, mine: {}, totalApproved: 0 });
  }
}

/* POST → submit/resubmit the caller's vote (goes to pending). */
export async function POST(req: NextRequest) {
  if (!cloudConfigured)
    return NextResponse.json({ error: "Cloud yapılandırılmamış" }, { status: 501 });

  const tok = verifyMouseToken(req.cookies.get(MOUSE_COOKIE)?.value);
  if (!tok)
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const me = await validMouse(tok.mouseId, tok.epoch);
  if (!me)
    return NextResponse.json(
      { error: "Oturumun geçersiz — tekrar giriş yap." },
      { status: 401 }
    );

  let targetId = "";
  let hotkey = false;
  let scores = null;
  try {
    const body = await req.json();
    targetId = String(body?.targetId ?? "");
    hotkey = !!body?.hotkey;
    scores = sanitizeScores(body?.scores);
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!targetId || !scores)
    return NextResponse.json({ error: "Geçersiz puan" }, { status: 400 });
  if (targetId === me.id)
    return NextResponse.json(
      { error: "Kendine puan veremezsin." },
      { status: 400 }
    );

  try {
    await submitVote(me, targetId, scores, hotkey);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Gönderilemedi" },
      { status: 500 }
    );
  }
}
