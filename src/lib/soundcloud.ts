import { createHash, randomBytes, randomUUID } from "node:crypto";

const API_BASE = "https://api.soundcloud.com";
const AUTH_BASE = "https://secure.soundcloud.com";

export interface SoundCloudUser {
  urn: string;
  username: string;
  full_name?: string | null;
  permalink: string;
  permalink_url: string;
  avatar_url?: string | null;
  followers_count?: number;
  followings_count?: number;
  playlist_count?: number;
  track_count?: number;
  public_favorites_count?: number;
  city?: string | null;
  country?: string | null;
}

export interface SoundCloudTrack {
  urn: string;
  title: string;
  artwork_url?: string | null;
  duration?: number;
  permalink_url: string;
  playback_count?: number;
  favoritings_count?: number;
  access?: "playable" | "preview" | "blocked" | string;
  user?: SoundCloudUser;
}

export interface SoundCloudPlaylist {
  urn: string;
  title: string;
  artwork_url?: string | null;
  track_count?: number;
  permalink_url: string;
  likes_count?: number;
  user?: SoundCloudUser;
}

interface CollectionResponse<T> {
  collection: T[];
  next_href?: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export function isSoundCloudConfigured() {
  return Boolean(
    process.env.SOUNDCLOUD_CLIENT_ID &&
      process.env.SOUNDCLOUD_CLIENT_SECRET &&
      process.env.SOUNDCLOUD_REDIRECT_URI,
  );
}

export function requireSoundCloudConfig() {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  const redirectUri = process.env.SOUNDCLOUD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "SoundCloud OAuth is not configured. Set SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET and SOUNDCLOUD_REDIRECT_URI.",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function createPkcePair() {
  const codeVerifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const state = `${randomUUID()}_${randomBytes(8).toString("hex")}`;
  return { codeVerifier, codeChallenge, state };
}

export function buildSoundCloudAuthorizeUrl({
  state,
  codeChallenge,
  mobile,
}: {
  state: string;
  codeChallenge: string;
  mobile?: boolean;
}) {
  const { clientId, redirectUri } = requireSoundCloudConfig();
  const url = new URL(`${AUTH_BASE}/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  if (mobile) url.searchParams.set("display", "popup");
  return url.toString();
}

async function tokenRequest(body: URLSearchParams) {
  const res = await fetch(`${AUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json; charset=utf-8",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text || `HTTP ${res.status}` };
  }
  if (!res.ok) {
    const err = json as { message?: string; error?: string };
    throw new Error(err.message || err.error || `SoundCloud token error ${res.status}`);
  }
  return json as TokenResponse;
}

export async function exchangeCodeForToken({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}) {
  const { clientId, clientSecret, redirectUri } = requireSoundCloudConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    code,
  });
  return tokenRequest(body);
}

export async function refreshSoundCloudToken(refreshToken: string) {
  const { clientId, clientSecret } = requireSoundCloudConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  return tokenRequest(body);
}

export async function soundCloudGet<T>(path: string, accessToken: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json; charset=utf-8",
      Authorization: `OAuth ${accessToken}`,
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text || `HTTP ${res.status}` };
  }
  if (!res.ok) {
    const err = json as { message?: string; code?: number };
    throw new Error(err.message || `SoundCloud API error ${res.status}`);
  }
  return json as T;
}

export async function disconnectSoundCloud(accessToken: string) {
  const res = await fetch(`${API_BASE}/disconnect`, {
    method: "POST",
    headers: {
      Accept: "application/json; charset=utf-8",
      Authorization: `OAuth ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 204 && res.status !== 400) {
    throw new Error(`Disconnect failed (${res.status})`);
  }
}

export function tokenExpiresAt(expiresInSeconds: number) {
  return new Date(Date.now() + Math.max(0, expiresInSeconds - 60) * 1000);
}

export async function fetchSoundCloudSnapshot(accessToken: string) {
  const [me, likes, playlists, recent] = await Promise.all([
    soundCloudGet<SoundCloudUser>("/me", accessToken),
    soundCloudGet<CollectionResponse<SoundCloudTrack>>(
      "/me/likes/tracks?limit=12&linked_partitioning=true&access=playable",
      accessToken,
    ),
    soundCloudGet<CollectionResponse<SoundCloudPlaylist>>(
      "/me/playlists?limit=12&linked_partitioning=true&show_tracks=false",
      accessToken,
    ),
    soundCloudGet<SoundCloudTrack[]>(
      "/me/recently-played/tracks?access=playable",
      accessToken,
    ),
  ]);

  return {
    me,
    likes: likes.collection ?? [],
    playlists: playlists.collection ?? [],
    recent: recent ?? [],
  };
}
