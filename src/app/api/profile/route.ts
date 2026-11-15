import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes, playlists, profile } from "@/db/schema";
import { audius } from "@/lib/audius";
import { count, eq } from "drizzle-orm";

async function getOrCreateProfile() {
  const rows = await db.select().from(profile).limit(1);
  if (rows.length > 0) return rows[0];
  const inserted = await db.insert(profile).values({}).returning();
  return inserted[0];
}

export async function GET() {
  const p = await getOrCreateProfile();
  const [[likeRow], [playlistRow]] = await Promise.all([
    db.select({ value: count() }).from(likes),
    db.select({ value: count() }).from(playlists),
  ]);
  return NextResponse.json({
    ...p,
    stats: { likes: likeRow?.value ?? 0, playlists: playlistRow?.value ?? 0 },
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    displayName?: string;
    audiusHandle?: string | null;
  };
  const p = await getOrCreateProfile();

  const patch: Partial<typeof profile.$inferInsert> = {};
  if (typeof body.displayName === "string" && body.displayName.trim()) {
    patch.displayName = body.displayName.trim().slice(0, 60);
  }
  if (body.audiusHandle !== undefined) {
    if (!body.audiusHandle) {
      // unlink
      patch.audiusHandle = null;
      patch.audiusUserId = null;
      patch.audiusName = null;
      patch.avatarUrl = null;
      patch.linkedAt = null;
    } else {
      const handle = body.audiusHandle.replace(/^@/, "").trim();
      const user = await audius.userByHandle(handle);
      if (!user) {
        return NextResponse.json(
          { error: `Профиль @${handle} не найден в Audius` },
          { status: 404 },
        );
      }
      patch.audiusHandle = user.handle;
      patch.audiusUserId = user.id;
      patch.audiusName = user.name;
      patch.avatarUrl =
        user.profile_picture?.["480x480"] ??
        user.profile_picture?.["150x150"] ??
        null;
      patch.linkedAt = new Date();
      if (!body.displayName) patch.displayName = user.name;
    }
  }

  const [updated] = await db
    .update(profile)
    .set(patch)
    .where(eq(profile.id, p.id))
    .returning();
  return NextResponse.json(updated);
}
