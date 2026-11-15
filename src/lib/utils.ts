export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function fmtDuration(sec: number) {
  if (!sec || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  return `${days} дн назад`;
}

/** Convert a DB snapshot row (likes / history / playlist_tracks) to a Track. */
export function snapToTrack(r: {
  trackId: string;
  title: string;
  artist: string;
  artistHandle?: string | null;
  artwork?: string | null;
  duration?: number | null;
  genre?: string | null;
  permalink?: string | null;
}) {
  return {
    id: r.trackId,
    title: r.title,
    artist: r.artist,
    artistHandle: r.artistHandle ?? "",
    artistId: "",
    artwork: r.artwork ?? null,
    duration: r.duration ?? 0,
    genre: r.genre ?? null,
    mood: null,
    playCount: 0,
    likeCount: 0,
    permalink: r.permalink ?? null,
  };
}
