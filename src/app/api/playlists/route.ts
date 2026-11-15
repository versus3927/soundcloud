import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(playlists)
    .orderBy(desc(playlists.updatedAt));
  const enriched = await Promise.all(
    rows.map(async (p) => {
      const [c] = await db
        .select({ value: count() })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, p.id));
      const first = await db
        .select({ artwork: playlistTracks.artwork })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, p.id))
        .orderBy(playlistTracks.position)
        .limit(1);
      return {
        ...p,
        trackCount: c?.value ?? 0,
        effectiveCover: p.coverUrl ?? first[0]?.artwork ?? null,
      };
    }),
  );
  return NextResponse.json({ playlists: enriched });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name?: string; description?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const [created] = await db
    .insert(playlists)
    .values({ name: name.slice(0, 80), description: body.description?.slice(0, 500) ?? "" })
    .returning();
  return NextResponse.json(created);
}
