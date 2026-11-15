"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import type { Track } from "@/lib/audius";
import { usePlayer } from "@/components/providers";
import { Artwork } from "@/components/artwork";
import { cn } from "@/lib/utils";

export function TrackCard({
  track,
  tracks,
  index,
}: {
  track: Track;
  tracks: Track[];
  index: number;
}) {
  const p = usePlayer();
  const isCurrent = p.current?.id === track.id;
  const playing = isCurrent && p.isPlaying;

  return (
    <div
      onClick={() => p.playTracks(tracks, index)}
      className="group fade-up cursor-pointer"
      style={{ animationDelay: `${Math.min(index, 20) * 0.03}s` }}
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-line bg-surface">
        <Artwork
          src={track.artwork}
          alt={track.title}
          size={240}
          className={cn(
            "h-full w-full transition-transform duration-500 group-hover:scale-105",
            playing && "scale-105",
          )}
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity",
            playing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        />
        <button
          className={cn(
            "absolute right-3 bottom-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-black shadow-[0_4px_24px_rgba(0,224,101,0.5)] transition-all",
            playing
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          )}
          aria-label={playing ? "Пауза" : "Играть"}
          onClick={(e) => {
            e.stopPropagation();
            if (isCurrent) p.toggle();
            else p.playTracks(tracks, index);
          }}
        >
          {playing ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        {track.genre && (
          <span className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-medium tracking-wide text-emerald-100 backdrop-blur-sm">
            {track.genre}
          </span>
        )}
      </div>
      <div
        className={cn(
          "truncate text-sm font-semibold",
          isCurrent ? "text-accent" : "text-ink",
        )}
      >
        {track.title}
      </div>
      <Link
        href={track.artistHandle ? `/artist/${track.artistHandle}` : "#"}
        onClick={(e) => e.stopPropagation()}
        className="block truncate text-xs text-mist transition-colors hover:text-accent"
      >
        {track.artist}
      </Link>
    </div>
  );
}
