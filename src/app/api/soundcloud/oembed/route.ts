import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to SoundCloud oEmbed endpoint.
 * No API keys required — this is a public endpoint.
 * Falls back to building an embed iframe directly if oEmbed fails.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  // Validate it's a SoundCloud URL
  if (
    !url.startsWith("https://soundcloud.com/") &&
    !url.startsWith("http://soundcloud.com/") &&
    !url.startsWith("https://on.soundcloud.com/")
  ) {
    return NextResponse.json(
      { error: "Это не ссылка на SoundCloud" },
      { status: 400 },
    );
  }

  // Try oEmbed first
  try {
    const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}&maxheight=166&color=%2300e065`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      },
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 5 && text.trim().startsWith("{")) {
        const data = JSON.parse(text);
        if (data.html) {
          return NextResponse.json(data);
        }
      }
    }
    // If oEmbed fails (404, empty response, geo-block) → fall through to direct embed
  } catch {
    // fall through to direct embed
  }

  // Fallback: build embed iframe directly from the URL
  // SoundCloud's widget API accepts any soundcloud.com URL via the widget iframe
  const encodedUrl = encodeURIComponent(url);
  const iframeSrc = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%2300e065&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=false`;

  // Extract a rough title from the URL path
  const pathParts = url
    .replace(/https?:\/\/(www\.)?soundcloud\.com\/?/, "")
    .split("/")
    .filter(Boolean);
  const guessedTitle = decodeURIComponent(
    pathParts[pathParts.length - 1] || "SoundCloud",
  )
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const guessedAuthor =
    pathParts.length >= 1
      ? decodeURIComponent(pathParts[0]).replace(/-/g, " ")
      : "SoundCloud";

  const html = `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="${iframeSrc}"></iframe>`;

  return NextResponse.json({
    title: guessedTitle,
    author_name: guessedAuthor,
    thumbnail_url: null,
    html,
    fallback: true,
  });
}
