"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, ListPlus, Pause, Play, Plus } from "lucide-react";
import type { Track } from "@/lib/audius";
import { useLikes, usePlayer, usePlaylists } from "@/components/providers";
import { Artwork } from "@/components/artwork";
import { cn, fmtDuration } from "@/lib/utils";

function TrackMenu({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { playlists, toggleTrack } = usePlaylists();
  const { playNext } = usePlayer();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-full p-2 text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-elev hover:text-accent"
        aria-label="Действия с треком"
      >
        <ListPlus size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-elev shadow-2xl shadow-black/60">
          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext(track);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-ink transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <Play size={14} /> Играть следующим
          </button>
          <div className="border-t border-line px-4 py-2 text-[10px] tracking-[0.15em] text-faint uppercase">
            В плейлист
          </div>
          {playlists.length === 0 && (
            <div className="px-4 pb-3 text-xs text-faint">
              Сначала создай плейлист в сайдбаре
            </div>
          )}
          <div className="max-h-44 overflow-y-auto pb-1.5">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={async (e) => {
                  e.stopPropagation();
                  const added = await toggleTrack(pl.id, track);
                  if (added) {
                    setDone(pl.id);
                    setTimeout(() => setDone(null), 900);
                  }
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-[13px] text-mist transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <span className="flex items-center gap-2 truncate">
                  <Plus size={13} />
                  <span className="truncate">{pl.name}</span>
                </span>
                {done === pl.id && <Check size={14} className="text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TrackRow({
  track,
  tracks,
  index,
  showArtist = true,
}: {
  track: Track;
  tracks: Track[];
  index: number;
  showArtist?: boolean;
}) {
  const p = usePlayer();
  const { ids, toggleLike } = useLikes();
  const isCurrent = p.current?.id === track.id;
  const liked = ids.has(track.id);

  return (
    <div
      onClick={() => p.playTracks(tracks, index)}
      className={cn(
        "group grid cursor-pointer grid-cols-[28px_44px_1fr_auto_auto] items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        isCurrent ? "bg-accent-soft/60" : "hover:bg-surface",
      )}
    >
      <div className="text-center font-mono text-xs text-faint">
        {isCurrent ? (
          p.isPlaying ? (
            <div className="mx-auto flex h-3 items-end justify-center gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-[2.5px] rounded-full bg-accent"
                  style={{ height: `${7 + i * 2}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : (
            <Pause size={13} className="mx-auto text-accent" />
          )
        ) : (
          index + 1
        )}
      </div>

      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
        <Artwork src={track.artwork} alt={track.title} size={44} />
        <div
          className={cn(
            "absolute inset-0 grid place-items-center bg-black/55 text-white transition-opacity",
            isCurrent ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {isCurrent && p.isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-sm font-medium",
            isCurrent ? "text-accent" : "text-ink",
          )}
        >
          {track.title}
        </div>
        {showArtist && (
          <Link
            href={track.artistHandle ? `/artist/${track.artistHandle}` : "#"}
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-xs text-mist transition-colors hover:text-accent"
          >
            {track.artist}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={cn(
            "rounded-full p-2 transition-all hover:scale-110",
            liked
              ? "text-accent"
              : "text-faint opacity-0 group-hover:opacity-100 hover:text-accent",
          )}
          aria-label="Лайк"
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
        </button>
        <TrackMenu track={track} />
      </div>

      <div className="w-10 text-right font-mono text-xs text-faint">
        {fmtDuration(track.duration)}
      </div>
    </div>
  );
}

export function TrackList({
  tracks,
  showArtist = true,
}: {
  tracks: Track[];
  showArtist?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {tracks.map((t, i) => (
        <TrackRow key={`${t.id}-${i}`} track={t} tracks={tracks} index={i} showArtist={showArtist} />
      ))}
    </div>
  );
}
