import { NextRequest, NextResponse } from "next/server";

// Public SoundCloud API Client ID (commonly used in open-source projects)
const PUBLIC_CLIENT_ID = "v8p9U7mI7rR6e8S3C5Xv0T8e9G9W6r5a"; 

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });

  try {
    // We use the mobile/public API endpoint which is more lenient
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${PUBLIC_CLIENT_ID}&limit=12`;
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
      }
    });

    if (!res.ok) {
        // If the public client_id is dead, we'll need to fetch a new one or return empty
        return NextResponse.json({ error: "SoundCloud API temporarily unavailable", results: [] }, { status: 200 });
    }

    const data = await res.json();
    const results = (data.collection || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        url: t.permalink_url,
        author: t.user?.username || "SoundCloud",
        artwork: t.artwork_url || t.user?.avatar_url || null,
        duration: Math.floor(t.duration / 1000)
    }));

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "Search failed", results: [] });
  }
}
