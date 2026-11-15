import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

async function parseId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Number(id);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const id = await parseId(ctx);
  const [pl] = await db.select().from(playlists).where(eq(playlists.id, id));
  if (!pl) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tracks = await db
    .select()
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, id))
    .orderBy(asc(playlistTracks.position), asc(playlistTracks.addedAt));
  return NextResponse.json({ ...pl, tracks });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const id = await parseId(ctx);
  const body = (await req.json()) as { name?: string; description?: string };
  const patch: Partial<typeof playlists.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim().slice(0, 80);
  }
  if (typeof body.description === "string") {
    patch.description = body.description.slice(0, 500);
  }
  const [updated] = await db
    .update(playlists)
    .set(patch)
    .where(eq(playlists.id, id))
    .returning();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const id = await parseId(ctx);
  await db.delete(playlists).where(eq(playlists.id, id));
  return NextResponse.json({ ok: true });
}
