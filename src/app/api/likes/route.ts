import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { Track } from "@/lib/audius";

export async function GET() {
  const rows = await db.select().from(likes).orderBy(desc(likes.createdAt));
  return NextResponse.json({ likes: rows, ids: rows.map((r) => r.trackId) });
}

/** Toggle like. Body: { track: Track } → { liked: boolean } */
export async function POST(req: NextRequest) {
  const { track } = (await req.json()) as { track: Track };
  if (!track?.id) {
    return NextResponse.json({ error: "track required" }, { status: 400 });
  }
  const existing = await db.query.likes.findFirst({
    where: (l, { eq }) => eq(l.trackId, track.id),
  });
  if (existing) {
    await db.delete(likes).where(eq(likes.trackId, track.id));
    return NextResponse.json({ liked: false });
  }
  await db.insert(likes).values({
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    artistHandle: track.artistHandle,
    artwork: track.artwork,
    duration: track.duration,
    genre: track.genre,
    permalink: track.permalink,
  });
  return NextResponse.json({ liked: true });
}
