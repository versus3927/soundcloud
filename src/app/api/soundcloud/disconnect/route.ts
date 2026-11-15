import { NextResponse } from "next/server";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateProfile } from "@/lib/local-profile";
import { disconnectSoundCloud } from "@/lib/soundcloud";
import { clearSoundCloudPatch } from "@/lib/soundcloud-link";

export async function POST() {
  const p = await getOrCreateProfile();
  if (p.soundcloudAccessToken) {
    try {
      await disconnectSoundCloud(p.soundcloudAccessToken);
    } catch {
      // clear locally anyway
    }
  }

  await db.update(profile).set(clearSoundCloudPatch()).where(eq(profile.id, p.id));
  return NextResponse.json({ ok: true });
}
