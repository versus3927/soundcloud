import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { history } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { Track } from "@/lib/audius";

export async function GET() {
  const rows = await db
    .select()
    .from(history)
    .orderBy(desc(history.playedAt))
    .limit(50);
  return NextResponse.json({ history: rows });
}

export async function POST(req: NextRequest) {
  const { track } = (await req.json()) as { track: Track };
  if (!track?.id) return NextResponse.json({ ok: true });
  await db
    .insert(history)
    .values({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artistHandle: track.artistHandle,
      artwork: track.artwork,
      duration: track.duration,
    })
    .onConflictDoUpdate({
      target: history.trackId,
      set: { playedAt: new Date(), title: track.title, artist: track.artist },
    });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await db.delete(history);
  return NextResponse.json({ ok: true });
}
