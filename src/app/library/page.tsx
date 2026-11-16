"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, Heart, ListMusic, Trash2 } from "lucide-react";
import { usePlaylists, type UserPlaylist } from "@/components/providers";
import { TrackList } from "@/components/track-row";
import { cn, snapToTrack } from "@/lib/utils";
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
  permalink?: string | null;
  createdAt?: string;
  playedAt?: string;
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

  const likeTracks: Track[] = likes.map(snapToTrack);
  const histTracks: Track[] = hist.map(snapToTrack);

  const TABS: { id: Tab; label: string; icon: typeof Heart; count: number }[] = [
    { id: "likes", label: "Лайки", icon: Heart, count: likes.length },
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

      {tab === "likes" &&
        (likeTracks.length > 0 ? (
          <div className="rounded-2xl border border-line bg-panel/60 p-2">
            <TrackList tracks={likeTracks} />
          </div>
        ) : (
          <EmptyBlock text="Пока пусто. Лайкай треки сердечком — они появятся здесь." />
        ))}

      {tab === "playlists" &&
        (playlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {playlists.map((pl: UserPlaylist) => (
              <Link key={pl.id} href={`/playlist/${pl.id}`} className="group">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pl.effectiveCover || ""}
                    alt={pl.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-[11px] font-medium text-emerald-100">
                    {pl.trackCount} тр.
                  </div>
                </div>
                <div className="truncate text-sm font-semibold text-ink group-hover:text-accent">
                  {pl.name}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBlock text="Плейлистов нет. Нажми «+» в сайдбаре, чтобы создать первый." />
        ))}

      {tab === "history" && (
        <>
          {histTracks.length > 0 ? (
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
              <div className="rounded-2xl border border-line bg-panel/60 p-2">
                <TrackList tracks={histTracks} />
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
