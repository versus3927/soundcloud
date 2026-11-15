import { NextRequest, NextResponse } from "next/server";
import { audius, normalizeTrack } from "@/lib/audius";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ tracks: [], users: [], playlists: [] });
  }
  const [tracks, users, playlists] = await Promise.all([
    audius.searchTracks(q),
    audius.searchUsers(q),
    audius.searchPlaylists(q),
  ]);
  return NextResponse.json({
    tracks: (tracks ?? [])
      .filter((t) => t.is_streamable !== false)
      .map(normalizeTrack),
    users: users ?? [],
    playlists: playlists ?? [],
  });
}
