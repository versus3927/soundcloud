import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes } from "@/db/schema";

interface ScTrack {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url: string | null;
  duration: number;
  user?: { username?: string; permalink?: string };
}

/** 
 * Resolves shortened URLs like on.soundcloud.com by following redirects.
 */
async function resolveShortUrl(url: string): Promise<string> {
  if (!url.includes("on.soundcloud.com")) return url;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const location = res.headers.get("location");
    return location || url;
  } catch {
    return url;
  }
}

/** Fetch a public client_id from SoundCloud's web app bundle. */
let cachedClientId: string | null = null;
let clientIdFetchedAt = 0;

async function getPublicClientId(): Promise<string | null> {
  if (cachedClientId && Date.now() - clientIdFetchedAt < 1800_000) {
    return cachedClientId;
  }
  try {
    const homeRes = await fetch("https://soundcloud.com", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await homeRes.text();
    const scriptUrls: string[] = [];
    const scriptRe = /src="(https:\/\/a-v2\.sndcdn\.com[^"]+\.js)"/g;
    let m: RegExpExecArray | null;
    while ((m = scriptRe.exec(html)) !== null) scriptUrls.push(m[1]);

    // Check last 5 scripts (usually they contain the logic)
    for (const scriptUrl of scriptUrls.slice(-5).reverse()) {
      const sr = await fetch(scriptUrl, { signal: AbortSignal.timeout(5000) });
      const src = await sr.text();
      const clientMatch = src.match(/client_id[:=]"([a-zA-Z0-9]{32})"/);
      if (clientMatch) {
        cachedClientId = clientMatch[1];
        clientIdFetchedAt = Date.now();
        return cachedClientId;
      }
    }
  } catch (e) {
    console.error("Failed to fetch SC client_id:", e);
  }
  // Fallback to a known working one if all fails
  return "v8p9U7mI7rR6e8S3C5Xv0T8e9G9W6r5a";
}

async function fetchScLikes(profileUrl: string, clientId: string): Promise<ScTrack[]> {
  // 1. Resolve URL to User/Resource
  const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${clientId}`;
  const userRes = await fetch(resolveUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(10000),
  });
  
  if (!userRes.ok) {
      // Try again with the base profile URL if it was a sub-url
      const baseUrl = profileUrl.split("/").slice(0, 4).join("/");
      const retryRes = await fetch(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(baseUrl)}&client_id=${clientId}`);
      if (!retryRes.ok) return [];
      const user = await retryRes.json();
      return fetchLikesById(user.id, clientId);
  }
  
  const resource = await userRes.json();
  const userId = resource.kind === "user" ? resource.id : resource.user_id;
  if (!userId) return [];

  return fetchLikesById(userId, clientId);
}

async function fetchLikesById(userId: number, clientId: string): Promise<ScTrack[]> {
  const likesRes = await fetch(
    `https://api-v2.soundcloud.com/users/${userId}/likes?client_id=${clientId}&limit=100&offset=0`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!likesRes.ok) return [];
  const likesData = await likesRes.json();

  const tracks: ScTrack[] = [];
  for (const item of likesData.collection ?? []) {
    const track = item.track || item;
    if (track && track.kind === "track" && track.id) {
      tracks.push({
        id: track.id,
        title: track.title,
        permalink_url: track.permalink_url,
        artwork_url: track.artwork_url || track.user?.avatar_url || null,
        duration: Math.floor((track.duration ?? 0) / 1000),
        user: track.user,
      });
    }
  }
  return tracks;
}

export async function POST(req: NextRequest) {
  try {
    const { profileUrl } = (await req.json()) as { profileUrl?: string };
    if (!profileUrl) return NextResponse.json({ error: "Ссылка обязательна" }, { status: 400 });

    const resolvedUrl = await resolveShortUrl(profileUrl.trim());
    const clientId = await getPublicClientId();
    
    if (!clientId) {
      return NextResponse.json({ error: "Не удалось подключиться к SoundCloud" }, { status: 503 });
    }

    const tracks = await fetchScLikes(resolvedUrl, clientId);

    if (tracks.length === 0) {
      return NextResponse.json({ 
        imported: 0, 
        total: 0,
        message: "Лайки не найдены. Убедись, что профиль публичный и в ссылке нет ошибок." 
      });
    }

    let imported = 0;
    for (const t of tracks) {
      try {
        await db
          .insert(likes)
          .values({
            trackId: `sc_${t.id}`,
            title: t.title,
            artist: t.user?.username || "SoundCloud Artist",
            artistHandle: t.user?.permalink || "",
            artwork: t.artwork_url,
            duration: t.duration,
            source: "soundcloud",
            permalink: t.permalink_url,
          })
          .onConflictDoNothing();
        imported++;
      } catch (e) {
        // skip duplicates or DB errors
      }
    }

    return NextResponse.json({ imported, total: tracks.length });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: "Произошла ошибка при импорте" }, { status: 500 });
  }
}
