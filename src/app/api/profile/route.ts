import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { db } from "@/db";
import { likes, playlists } from "@/db/schema";
import { audius } from "@/lib/audius";
import { count } from "drizzle-orm";
import { getOrCreateProfile, patchProfile } from "@/lib/local-profile";

function dbPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return new Pool({ connectionString: url, max: 1 });
}

export async function GET() {
  try {
    const p = await getOrCreateProfile();
    let likesCount = 0;
    let playlistsCount = 0;
    try {
      const [[lr], [pr]] = await Promise.all([
        db.select({ value: count() }).from(likes),
        db.select({ value: count() }).from(playlists),
      ]);
      likesCount = Number(lr?.value ?? 0);
      playlistsCount = Number(pr?.value ?? 0);
    } catch {}

    return NextResponse.json({
      ...p,
      avatarUrl: p.waveAvatarUrl ?? p.avatarUrl,
      stats: { likes: likesCount, playlists: playlistsCount },
    });
  } catch (e) {
    console.error("[profile GET]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      displayName?: string;
      audiusHandle?: string | null;
      waveProfileUrl?: string | null;
    };
    const p = await getOrCreateProfile();
    const patch: Record<string, unknown> = {};

    if (typeof body.displayName === "string" && body.displayName.trim()) {
      patch.displayName = body.displayName.trim().slice(0, 60);
    }

    if (body.audiusHandle !== undefined) {
      if (!body.audiusHandle) {
        patch.audiusHandle = null;
        patch.audiusUserId = null;
        patch.audiusName = null;
        patch.avatarUrl = null;
        patch.linkedAt = null;
      } else {
        const handle = body.audiusHandle.replace(/^@/, "").trim();
        const user = await audius.userByHandle(handle);
        if (user) {
          patch.audiusHandle = user.handle;
          patch.audiusUserId = user.id;
          patch.audiusName = user.name;
          patch.avatarUrl =
            user.profile_picture?.["480x480"] ??
            user.profile_picture?.["150x150"] ??
            null;
          patch.linkedAt = new Date();
          if (!body.displayName) patch.displayName = user.name;
        } else {
          return NextResponse.json(
            { error: `Профиль @${handle} не найден в Audius` },
            { status: 404 },
          );
        }
      }
    }

    if (body.waveProfileUrl !== undefined) {
      if (!body.waveProfileUrl) {
        patch.waveProfileUrl = null;
        patch.waveUsername = null;
        patch.waveAvatarUrl = null;
        patch.waveLinkedAt = null;
      } else {
        const url = body.waveProfileUrl.trim();
        const match = url.match(/wave\.com\/([^/?#]+)/);
        if (match) {
          patch.waveProfileUrl = url;
          patch.waveUsername = match[1];
          patch.waveLinkedAt = new Date();
        }
      }
    }

    const updated = await patchProfile(p.id, patch);
    return NextResponse.json({
      ...updated,
      avatarUrl: updated.waveAvatarUrl ?? updated.avatarUrl,
    });
  } catch (e) {
    console.error("[profile PATCH]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
