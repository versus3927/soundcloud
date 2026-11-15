import { NextRequest, NextResponse } from "next/server";
import { audius, normalizeTrack } from "@/lib/audius";

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined;
  const time = req.nextUrl.searchParams.get("time") ?? "week";
  const data = await audius.trending(time, genre);
  if (!data) {
    return NextResponse.json({ tracks: [] }, { status: 200 });
  }
  return NextResponse.json({
    tracks: data.filter((t) => t.is_streamable !== false).map(normalizeTrack),
  });
}
