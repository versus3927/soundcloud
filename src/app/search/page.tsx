"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BadgeCheck, SearchX } from "lucide-react";
import type { AudiusPlaylist, AudiusUser, Track } from "@/lib/audius";
import { TrackList } from "@/components/track-row";
import { Artwork } from "@/components/artwork";
import { cn, fmtCount } from "@/lib/utils";

type Tab = "tracks" | "artists" | "playlists";

function SearchInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [tab, setTab] = useState<Tab>("tracks");
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [users, setUsers] = useState<AudiusUser[]>([]);
  const [playlists, setPlaylists] = useState<AudiusPlaylist[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setTracks([]);
      setUsers([]);
      setPlaylists([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => {
          setTracks(j.tracks ?? []);
          setUsers(j.users ?? []);
          setPlaylists(j.playlists ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "tracks", label: "Треки", count: tracks.length },
    { id: "artists", label: "Артисты", count: users.length },
    { id: "playlists", label: "Плейлисты", count: playlists.length },
  ];

  return (
    <div className="px-8 pt-8 pb-12">
      <h1 className="font-display mb-1 text-3xl font-black tracking-tight">
        Поиск
      </h1>
      <p className="mb-6 text-sm text-mist">
        {q ? (
          <>
            Результаты по запросу{" "}
            <span className="font-semibold text-accent">«{q}»</span>
          </>
        ) : (
          "Введи запрос в строке выше — ищем по всей сети Audius"
        )}
      </p>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === t.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-panel text-mist hover:text-ink",
            )}
          >
            {t.label}
            {t.count > 0 && <span className="ml-2 text-xs opacity-70">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-16 text-sm text-mist">
          <span className="live-dot h-2 w-2 rounded-full bg-accent" />
          Слушаем эфир…
        </div>
      )}

      {!loading && q && tab === "tracks" && (
        tracks.length > 0 ? (
          <div className="rounded-2xl border border-line bg-panel/60 p-2">
            <TrackList tracks={tracks} />
          </div>
        ) : (
          <Empty />
        )
      )}

      {!loading && q && tab === "artists" && (
        users.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/artist/${u.handle}`}
                className="group rounded-2xl border border-line bg-panel/60 p-5 text-center transition-all hover:border-accent/40 hover:bg-surface"
              >
                <Artwork
                  src={u.profile_picture?.["480x480"] ?? u.profile_picture?.["150x150"]}
                  alt={u.name}
                  size={120}
                  className="mx-auto mb-4 aspect-square rounded-full border-2 border-line transition-colors group-hover:border-accent/60"
                />
                <div className="flex items-center justify-center gap-1.5 truncate text-sm font-semibold text-ink">
                  <span className="truncate">{u.name}</span>
                  {u.is_verified && <BadgeCheck size={14} className="shrink-0 text-accent" />}
                </div>
                <div className="mt-1 text-xs text-faint">
                  {fmtCount(u.follower_count ?? 0)} слушателей
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty />
        )
      )}

      {!loading && q && tab === "playlists" && (
        playlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {playlists.map((pl) => (
              <Link key={pl.id} href={`/discover/${pl.id}`} className="group">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-line">
                  <Artwork
                    src={pl.artwork?.["480x480"] ?? pl.artwork?.["150x150"]}
                    alt={pl.playlist_name}
                    size={220}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="truncate text-sm font-semibold text-ink group-hover:text-accent">
                  {pl.playlist_name}
                </div>
                <div className="truncate text-xs text-mist">
                  {pl.user?.name} · {pl.track_count} тр.
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty />
        )
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line py-20 text-center">
      <SearchX className="mb-3 text-faint" size={26} />
      <p className="text-sm text-mist">Ничего не нашлось. Попробуй другой запрос.</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
