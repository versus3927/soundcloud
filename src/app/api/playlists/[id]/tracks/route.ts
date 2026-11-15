import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { and, eq, max } from "drizzle-orm";
import type { Track } from "@/lib/audius";

/** Body: { track: Track } → toggles membership of track in playlist. */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const playlistId = Number(id);
  const { track } = (await req.json()) as { track: Track };
  if (!track?.id) {
    return NextResponse.json({ error: "track required" }, { status: 400 });
  }
  const [pl] = await db.select().from(playlists).where(eq(playlists.id, playlistId));
  if (!pl) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [existing] = await db
    .select()
    .from(playlistTracks)
    .where(
      and(
        eq(playlistTracks.playlistId, playlistId),
        eq(playlistTracks.trackId, track.id),
      ),
    );
  if (existing) {
    await db
      .delete(playlistTracks)
      .where(eq(playlistTracks.id, existing.id));
    return NextResponse.json({ added: false });
  }

  const [maxRow] = await db
    .select({ value: max(playlistTracks.position) })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId));

  await db.insert(playlistTracks).values({
    playlistId,
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    artistHandle: track.artistHandle,
    artwork: track.artwork,
    duration: track.duration,
    permalink: track.permalink,
    position: (maxRow?.value ?? 0) + 1,
  });
  await db
    .update(playlists)
    .set({ updatedAt: new Date() })
    .where(eq(playlists.id, playlistId));
  return NextResponse.json({ added: true });
}

/** Body: { trackId: string } → remove */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { trackId } = (await req.json()) as { trackId: string };
  await db
    .delete(playlistTracks)
    .where(
      and(
        eq(playlistTracks.playlistId, Number(id)),
        eq(playlistTracks.trackId, trackId),
      ),
    );
  return NextResponse.json({ ok: true });
}
