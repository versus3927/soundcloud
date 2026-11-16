"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, ExternalLink, Heart, ListMusic, Trash2 } from "lucide-react";
import { usePlaylists, type UserPlaylist } from "@/components/providers";
import { TrackList } from "@/components/track-row";
import { Artwork } from "@/components/artwork";
import { cn, snapToTrack, timeAgo } from "@/lib/utils";
import type { Track } from "@/lib/audius";

type Tab = "likes" | "playlists" | "history";

interface SnapRow {
  id: number;
  trackId: string;
  title: string;
  artist: string;
  artistHandle: string;
  artwork: string | null;
  duration: number;
  source?: string | null;
  genre?: string | null;
  permalink?: string | null;
  createdAt?: string;
  playedAt?: string;
}

function ExternalTrackRow({ row }: { row: SnapRow }) {
  return (
    <a
      href={row.permalink ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-surface"
    >
      <div className="w-7 text-center font-mono text-xs text-faint">
        <ExternalLink size={12} className="mx-auto" />
      </div>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
        <Artwork src={row.artwork} alt={row.title} size={44} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink group-hover:text-accent">
          {row.title}
        </div>
        <div className="truncate text-xs text-mist">{row.artist}</div>
      </div>
      <div className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] text-faint">
        web
      </div>
    </a>
  );
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("likes");
  const [likes, setLikes] = useState<SnapRow[]>([]);
  const [hist, setHist] = useState<SnapRow[]>([]);
  const { playlists } = usePlaylists();

  useEffect(() => {
    fetch("/api/likes")
      .then((r) => r.json())
      .then((j) => setLikes(j.likes ?? []))
      .catch(() => {});
    fetch("/api/history")
      .then((r) => r.json())
      .then((j) => setHist(j.history ?? []))
      .catch(() => {});
  }, [tab]);

  // Split likes: local (Audius) vs external (sc_)
  const auidiusLikes = likes.filter((r) => !r.trackId.startsWith("sc_"));
  const externalLikes = likes.filter((r) => r.trackId.startsWith("sc_"));
  const audiusLikeTracks: Track[] = auidiusLikes.map(snapToTrack);
  const histTracks: Track[] = hist.filter((r) => !r.trackId.startsWith("sc_")).map(snapToTrack);
  const extHistRows = hist.filter((r) => r.trackId.startsWith("sc_"));

  const totalLikes = likes.length;

  const TABS: { id: Tab; label: string; icon: typeof Heart; count: number }[] = [
    { id: "likes", label: "Лайки", icon: Heart, count: totalLikes },
    { id: "playlists", label: "Плейлисты", icon: ListMusic, count: playlists.length },
    { id: "history", label: "История", icon: Clock3, count: hist.length },
  ];

  return (
    <div className="px-8 pt-8 pb-12">
      <h1 className="font-display mb-6 text-3xl font-black tracking-tight">
        Библиотека
      </h1>

      <div className="mb-6 flex gap-2">
        {TABS.map(({ id, label, icon: Icon, count: c }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === id
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-panel text-mist hover:text-ink",
            )}
          >
            <Icon size={14} />
            {label}
            <span className="text-xs opacity-70">{c}</span>
          </button>
        ))}
      </div>

      {tab === "likes" && (
        totalLikes === 0 ? (
          <EmptyBlock text="Пока пусто. Лайкай треки сердечком — они появятся здесь." />
        ) : (
          <div className="space-y-6">
            {/* External (web) tracks */}
            {externalLikes.length > 0 && (
              <div>
                {audiusLikeTracks.length > 0 && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                      Импортированные
                    </span>
                    <span className="text-[11px] text-faint">
                      · нажми чтобы открыть
                    </span>
                  </div>
                )}
                <div className="rounded-2xl border border-line bg-panel/60 p-2 space-y-0.5">
                  {externalLikes.map((row) => (
                    <ExternalTrackRow key={row.id} row={row} />
                  ))}
                </div>
              </div>
            )}

            {/* Audius tracks (streamable) */}
            {audiusLikeTracks.length > 0 && (
              <div>
                {externalLikes.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                      Локальные лайки
                    </span>
                  </div>
                )}
                <div className="rounded-2xl border border-line bg-panel/60 p-2">
                  <TrackList tracks={audiusLikeTracks} />
                </div>
              </div>
            )}
          </div>
        )
      )}

      {tab === "playlists" &&
        (playlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {playlists.map((pl: UserPlaylist) => (
              <Link key={pl.id} href={`/playlist/${pl.id}`} className="group">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-line">
                  <Artwork
                    src={pl.effectiveCover}
                    alt={pl.name}
                    size={220}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-[11px] font-medium text-emerald-100">
                    {pl.trackCount} тр.
                  </div>
                </div>
                <div className="truncate text-sm font-semibold text-ink group-hover:text-accent">
                  {pl.name}
                </div>
                <div className="text-xs text-faint">
                  обновлён {timeAgo(pl.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBlock text="Плейлистов нет. Нажми «+» в сайдбаре, чтобы создать первый." />
        ))}

      {tab === "history" && (
        <>
          {hist.length > 0 ? (
            <>
              <div className="mb-3 flex justify-end">
                <button
                  onClick={async () => {
                    await fetch("/api/history", { method: "DELETE" });
                    setHist([]);
                  }}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-xs text-mist transition-colors hover:border-red-400/40 hover:text-red-300"
                >
                  <Trash2 size={13} /> Очистить историю
                </button>
              </div>
              <div className="space-y-6">
                {extHistRows.length > 0 && (
                  <div className="rounded-2xl border border-line bg-panel/60 p-2 space-y-0.5">
                    {extHistRows.map((row) => (
                      <ExternalTrackRow key={row.id} row={row} />
                    ))}
                  </div>
                )}
                {histTracks.length > 0 && (
                  <div className="rounded-2xl border border-line bg-panel/60 p-2">
                    <TrackList tracks={histTracks} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyBlock text="История пуста. Как только включишь трек — он появится здесь." />
          )}
        </>
      )}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line py-20 text-center">
      <Heart className="mb-3 text-faint" size={24} />
      <p className="max-w-sm text-sm text-mist">{text}</p>
    </div>
  );
}
