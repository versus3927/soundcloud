import Link from "next/link";
import { notFound } from "next/navigation";
import { AudioLines } from "lucide-react";
import { audius, normalizeTrack } from "@/lib/audius";
import { TrackList } from "@/components/track-row";
import { Artwork } from "@/components/artwork";
import { fmtCount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DiscoverPlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lists, rawTracks] = await Promise.all([
    audius.trendingPlaylists(),
    audius.playlistTracks(id),
  ]);
  const pl = (lists ?? []).find((l) => l.id === id);
  const tracks = (rawTracks ?? [])
    .filter((t) => t.is_streamable !== false)
    .map(normalizeTrack);

  if (!pl && tracks.length === 0) notFound();

  return (
    <div className="px-8 pt-8 pb-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end">
        <Artwork
          src={pl?.artwork?.["480x480"] ?? tracks[0]?.artwork}
          alt={pl?.playlist_name ?? "Подборка"}
          size={200}
          className="h-[200px] w-[200px] rounded-3xl border border-line shadow-2xl shadow-black/50"
        />
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
            <AudioLines size={13} />
            Подборка Audius
          </div>
          <h1 className="font-display mb-2 text-4xl font-black tracking-tight">
            {pl?.playlist_name ?? "Подборка"}
          </h1>
          {pl?.user && (
            <Link
              href={`/artist/${pl.user.handle}`}
              className="text-sm text-mist transition-colors hover:text-accent"
            >
              {pl.user.name}
            </Link>
          )}
          <div className="mt-2 text-xs text-faint">
            {tracks.length} треков
            {pl?.total_play_count ? ` · ${fmtCount(pl.total_play_count)} прослушиваний` : ""}
          </div>
          {pl?.description && (
            <p className="mt-3 line-clamp-3 max-w-2xl text-[13px] text-mist">
              {pl.description}
            </p>
          )}
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className="rounded-2xl border border-line bg-panel/60 p-2">
          <TrackList tracks={tracks} />
        </div>
      ) : (
        <p className="text-sm text-mist">Не удалось загрузить треки этой подборки.</p>
      )}
    </div>
  );
}
