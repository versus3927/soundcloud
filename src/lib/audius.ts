// ─────────────────────────────────────────────────────────────
//  Audius API client — open Wave alternative.
//  Works without VPN / API keys. Docs: https://docs.audius.org
// ─────────────────────────────────────────────────────────────

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  is_verified?: boolean;
  follower_count?: number;
  followee_count?: number;
  track_count?: number;
  playlist_count?: number;
  bio?: string;
  location?: string;
  profile_picture?: {
    "150x150"?: string;
    "480x480"?: string;
    "1000x1000"?: string;
  };
  cover_photo?: { "640x"?: string; "2000x"?: string };
}

export interface AudiusTrack {
  id: string;
  title: string;
  user: AudiusUser;
  artwork?: {
    "150x150"?: string;
    "480x480"?: string;
    "1000x1000"?: string;
  };
  duration: number;
  play_count: number;
  favorite_count?: number;
  repost_count?: number;
  genre?: string;
  mood?: string;
  permalink?: string;
  release_date?: string;
  description?: string;
  is_streamable?: boolean;
}

export interface AudiusPlaylist {
  id: string;
  playlist_name: string;
  user: AudiusUser;
  artwork?: {
    "150x150"?: string;
    "480x480"?: string;
    "1000x1000"?: string;
  };
  track_count: number;
  total_play_count?: number;
  description?: string;
  is_album?: boolean;
  permalink?: string;
}

/** Normalised track shape used across the whole app (UI + DB snapshots). */
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  artistId: string;
  artwork: string | null;
  duration: number;
  genre: string | null;
  mood: string | null;
  playCount: number;
  likeCount: number;
  permalink: string | null;
}

const APP_NAME = "versuscloud";

const FALLBACK_HOSTS = [
  "https://discoveryprovider.audius.co",
  "https://discoveryprovider2.audius.co",
  "https://discoveryprovider3.audius.co",
  "https://audius-discovery-1.cultur3stake.com",
  "https://discoveryprovider.audius1.prod-us-west-2.staked.cloud",
];

let hostsCache: { hosts: string[]; at: number } | null = null;

/** Resolve the list of healthy Audius discovery nodes (cached for 10 min). */
export async function getHosts(): Promise<string[]> {
  if (hostsCache && Date.now() - hostsCache.at < 10 * 60 * 1000) {
    return hostsCache.hosts;
  }
  try {
    const res = await fetch("https://api.audius.co", {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: string[] };
      if (Array.isArray(json.data) && json.data.length > 0) {
        hostsCache = { hosts: json.data, at: Date.now() };
        return json.data;
      }
    }
  } catch {
    // fall through to static hosts
  }
  hostsCache = { hosts: FALLBACK_HOSTS, at: Date.now() };
  return FALLBACK_HOSTS;
}

async function audiusFetch<T>(path: string): Promise<T | null> {
  const hosts = await getHosts();
  const sep = path.includes("?") ? "&" : "?";
  for (const host of hosts.slice(0, 3)) {
    try {
      const res = await fetch(
        `${host}/v1${path}${sep}app_name=${APP_NAME}`,
        { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) },
      );
      if (res.ok) {
        const json = (await res.json()) as { data?: T };
        return (json.data ?? null) as T | null;
      }
    } catch {
      // try next host
    }
  }
  return null;
}

export function normalizeTrack(t: AudiusTrack): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.user?.name ?? "Unknown artist",
    artistHandle: t.user?.handle ?? "",
    artistId: t.user?.id ?? "",
    artwork: t.artwork?.["480x480"] ?? t.artwork?.["150x150"] ?? null,
    duration: t.duration ?? 0,
    genre: t.genre ?? null,
    mood: t.mood ?? null,
    playCount: t.play_count ?? 0,
    likeCount: t.favorite_count ?? 0,
    permalink: t.permalink ?? null,
  };
}

export const audius = {
  trending: (time = "week", genre?: string, limit = 40) =>
    audiusFetch<AudiusTrack[]>(
      `/tracks/trending?time=${time}&limit=${limit}${genre ? `&genre=${encodeURIComponent(genre)}` : ""}`,
    ),
  searchTracks: (q: string) =>
    audiusFetch<AudiusTrack[]>(`/tracks/search?query=${encodeURIComponent(q)}`),
  searchUsers: (q: string) =>
    audiusFetch<AudiusUser[]>(`/users/search?query=${encodeURIComponent(q)}`),
  searchPlaylists: (q: string) =>
    audiusFetch<AudiusPlaylist[]>(`/playlists/search?query=${encodeURIComponent(q)}`),
  trendingPlaylists: () => audiusFetch<AudiusPlaylist[]>("/playlists/trending"),
  track: (id: string) => audiusFetch<AudiusTrack>(`/tracks/${id}`),
  userByHandle: (handle: string) =>
    audiusFetch<AudiusUser>(`/users/handle/${encodeURIComponent(handle)}`),
  userTracks: (userId: string) =>
    audiusFetch<AudiusTrack[]>(`/users/${encodeURIComponent(userId)}/tracks`),
  userFavorites: (userId: string) =>
    audiusFetch<{ favorite_item_id: string }[]>(
      `/users/${encodeURIComponent(userId)}/favorites`,
    ),
  playlistTracks: (id: string) =>
    audiusFetch<AudiusTrack[]>(`/playlists/${encodeURIComponent(id)}/tracks`),
  streamUrl: async (trackId: string) => {
    const hosts = await getHosts();
    return `${hosts[0]}/v1/tracks/${encodeURIComponent(trackId)}/stream?app_name=${APP_NAME}`;
  },
};
