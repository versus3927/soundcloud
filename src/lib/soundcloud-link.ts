import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  fetchSoundCloudSnapshot,
  refreshSoundCloudToken,
  tokenExpiresAt,
  type SoundCloudUser,
} from "@/lib/soundcloud";
import { getOrCreateProfile } from "@/lib/local-profile";

export function clearSoundCloudPatch(): Partial<typeof profile.$inferInsert> {
  return {
    soundcloudUserUrn: null,
    soundcloudUsername: null,
    soundcloudFullName: null,
    soundcloudPermalink: null,
    soundcloudPermalinkUrl: null,
    soundcloudAvatarUrl: null,
    soundcloudAccessToken: null,
    soundcloudRefreshToken: null,
    soundcloudTokenExpiresAt: null,
    soundcloudLinkedAt: null,
  };
}

export function userToSoundCloudPatch(
  me: SoundCloudUser,
  token?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  },
): Partial<typeof profile.$inferInsert> {
  return {
    soundcloudUserUrn: me.urn,
    soundcloudUsername: me.username,
    soundcloudFullName: me.full_name ?? me.username,
    soundcloudPermalink: me.permalink,
    soundcloudPermalinkUrl: me.permalink_url,
    soundcloudAvatarUrl: me.avatar_url ?? null,
    soundcloudAccessToken: token?.access_token,
    soundcloudRefreshToken: token?.refresh_token,
    soundcloudTokenExpiresAt: token ? tokenExpiresAt(token.expires_in) : undefined,
    soundcloudLinkedAt: new Date(),
  };
}

export async function ensureFreshSoundCloudAccessToken() {
  const p = await getOrCreateProfile();
  if (!p.soundcloudAccessToken || !p.soundcloudRefreshToken) {
    throw new Error("SoundCloud account is not connected");
  }

  const expiresAt = p.soundcloudTokenExpiresAt
    ? new Date(p.soundcloudTokenExpiresAt)
    : null;
  const almostExpired = !expiresAt || expiresAt.getTime() < Date.now() + 60_000;

  if (!almostExpired) {
    return { accessToken: p.soundcloudAccessToken, profile: p };
  }

  const refreshed = await refreshSoundCloudToken(p.soundcloudRefreshToken);
  const [updated] = await db
    .update(profile)
    .set({
      soundcloudAccessToken: refreshed.access_token,
      soundcloudRefreshToken: refreshed.refresh_token,
      soundcloudTokenExpiresAt: tokenExpiresAt(refreshed.expires_in),
    })
    .where(eq(profile.id, p.id))
    .returning();

  return { accessToken: refreshed.access_token, profile: updated ?? p };
}

export async function loadSoundCloudSnapshot() {
  const { accessToken } = await ensureFreshSoundCloudAccessToken();
  return fetchSoundCloudSnapshot(accessToken);
}
