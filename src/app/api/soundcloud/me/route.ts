import { NextResponse } from "next/server";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateProfile } from "@/lib/local-profile";
import { isSoundCloudConfigured } from "@/lib/soundcloud";
import { loadSoundCloudSnapshot, userToSoundCloudPatch } from "@/lib/soundcloud-link";

export async function GET() {
  if (!isSoundCloudConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        error:
          "На сервере не настроен SoundCloud OAuth. Добавь SOUNDCLOUD_CLIENT_ID / SECRET / REDIRECT_URI.",
      },
      { status: 200 },
    );
  }

  const p = await getOrCreateProfile();
  if (!p.soundcloudAccessToken || !p.soundcloudRefreshToken) {
    return NextResponse.json({ configured: true, connected: false }, { status: 200 });
  }

  try {
    const snapshot = await loadSoundCloudSnapshot();
    await db
      .update(profile)
      .set(userToSoundCloudPatch(snapshot.me))
      .where(eq(profile.id, p.id));

    return NextResponse.json({
      configured: true,
      connected: true,
      me: snapshot.me,
      likes: snapshot.likes,
      playlists: snapshot.playlists,
      recent: snapshot.recent,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json(
      { configured: true, connected: false, error: message },
      { status: 500 },
    );
  }
}
