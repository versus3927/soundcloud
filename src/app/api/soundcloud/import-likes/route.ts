import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes } from "@/db/schema";
import { sql } from "drizzle-orm";

interface ScTrack {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url: string | null;
  duration: number;
  user?: { username?: string; permalink?: string };
}

/** Fetch a public client_id from SoundCloud's web app bundle. Cached 1h. */
let cachedClientId: string | null = null;
let clientIdFetchedAt = 0;

async function getPublicClientId(): Promise<string | null> {
  if (cachedClientId && Date.now() - clientIdFetchedAt < 3600_000) {
    return cachedClientId;
  }
  try {
    // Fetch SC homepage to find script URLs
    const homeRes = await fetch("https://soundcloud.com", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await homeRes.text();

    // Find cross-origin script URLs
    const scriptUrls: string[] = [];
    const scriptRe = /src="(https:\/\/a-v2\.sndcdn\.com[^"]+\.js)"/g;
    let m: RegExpExecArray | null;
    while ((m = scriptRe.exec(html)) !== null) {
      scriptUrls.push(m[1]);
    }

    for (const scriptUrl of scriptUrls.slice(-3)) {
      const sr = await fetch(scriptUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      const src = await sr.text();
      const clientMatch = src.match(/client_id:"([a-zA-Z0-9]{32})"/);
      if (clientMatch) {
        cachedClientId = clientMatch[1];
        clientIdFetchedAt = Date.now();
        return cachedClientId;
      }
    }
  } catch {}
  return null;
}

async function fetchScLikes(username: string, clientId: string): Promise<ScTrack[]> {
  // 1. Resolve user
  const userRes = await fetch(
    `https://api-v2.soundcloud.com/resolve?url=https://soundcloud.com/${encodeURIComponent(username)}&client_id=${clientId}`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!userRes.ok) return [];
  const user = await userRes.json();
  const userId = user.id as number;

  // 2. Fetch likes
  const likesRes = await fetch(
    `https://api-v2.soundcloud.com/users/${userId}/likes?client_id=${clientId}&limit=50&offset=0`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!likesRes.ok) return [];
  const likesData = await likesRes.json();

  const tracks: ScTrack[] = [];
  for (const item of likesData.collection ?? []) {
    const track = item.track ?? item;
    if (track?.title && track?.permalink_url) {
      tracks.push({
        id: track.id,
        title: track.title,
        permalink_url: track.permalink_url,
        artwork_url: track.artwork_url ?? null,
        duration: Math.floor((track.duration ?? 0) / 1000),
        user: track.user,
      });
    }
  }
  return tracks;
}

export async function POST(req: NextRequest) {
  const { profileUrl } = (await req.json()) as { profileUrl?: string };
  if (!profileUrl) {
    return NextResponse.json({ error: "profileUrl required" }, { status: 400 });
  }
  const match = profileUrl.match(/soundcloud\.com\/([^/?#]+)/);
  if (!match) {
    return NextResponse.json(
      { error: "Не удалось определить имя пользователя из ссылки" },
      { status: 400 },
    );
  }
  const username = match[1];

  const clientId = await getPublicClientId();
  if (!clientId) {
    return NextResponse.json(
      { error: "Не удалось получить доступ к SoundCloud API. Попробуй позже." },
      { status: 503 },
    );
  }

  let tracks: ScTrack[] = [];
  try {
    tracks = await fetchScLikes(username, clientId);
  } catch (e) {
    return NextResponse.json(
      { error: `Ошибка при загрузке лайков: ${e instanceof Error ? e.message : e}` },
      { status: 502 },
    );
  }

  if (tracks.length === 0) {
    return NextResponse.json({ imported: 0, message: "У этого профиля нет публичных лайков или профиль не найден." });
  }

  let imported = 0;
  for (const t of tracks) {
    try {
      await db
        .insert(likes)
        .values({
          trackId: `sc_${t.id}`,
          title: t.title,
          artist: t.user?.username ?? username,
          artistHandle: t.user?.permalink ?? username,
          artwork: t.artwork_url ?? null,
          duration: t.duration,
          genre: null,
          permalink: t.permalink_url,
          source: "soundcloud",
        })
        .onConflictDoNothing();
      imported++;
    } catch {}
  }

  return NextResponse.json({ imported, total: tracks.length });
}
