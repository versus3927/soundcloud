"use client";

import Link from "next/link";
import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLikes, usePlayer } from "@/components/providers";
import { Artwork } from "@/components/artwork";
import { fmtDuration, cn } from "@/lib/utils";

function Eq({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-3.5 items-end gap-[2.5px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "eq-bar w-[3px] rounded-full bg-accent",
            !playing && "[animation-play-state:paused]",
          )}
          style={{
            height: `${8 + (i % 3) * 3}px`,
            animationDelay: `${i * 0.13}s`,
            animationDuration: `${0.7 + i * 0.11}s`,
          }}
        />
      ))}
    </div>
  );
}

export function PlayerBar() {
  const p = usePlayer();
  const { ids, toggleLike } = useLikes();
  const t = p.current;
  const progress = p.duration > 0 ? (p.currentTime / p.duration) * 100 : 0;
  const liked = t ? ids.has(t.id) : false;
  const isWebTrack = Boolean(t?.id.startsWith("sc_") && t?.permalink);

  return (
    <div className="relative z-40 border-t border-line bg-panel/95 backdrop-blur-xl">
      {/* progress on the top edge */}
      <div className="group/slider absolute -top-[2px] right-0 left-0">
          <input
            type="range"
            min={0}
            max={p.duration || 0}
            step={0.1}
            value={p.currentTime}
            onChange={(e) => p.seek(Number(e.target.value))}
            disabled={isWebTrack}
            className="block h-[6px] w-full hover:h-[8px] transition-all disabled:opacity-40"
            style={{ ["--fill" as string]: `${progress}%` }}
            aria-label="Позиция"
          />
      </div>

      <div className="grid h-[84px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        {/* left: track info */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            isWebTrack && "cursor-pointer rounded-xl px-2 py-1 transition-colors hover:bg-surface",
          )}
          onClick={() => {
            if (isWebTrack && t?.permalink) {
              // Redirect locally to Wave player page from bottom bar click
              window.location.href = `/wave?play=${encodeURIComponent(t.permalink)}`;
            }
          }}
          title={isWebTrack ? "Открыть Wave" : undefined}
        >
          {t ? (
            <>
              <div className={cn("relative shrink-0", p.isPlaying && "glow-accent rounded-lg")}>
                <Artwork
                  src={t.artwork}
                  alt={t.title}
                  size={52}
                  className={cn("rounded-lg", p.isPlaying && "spin-slow")}
                  spinning={false}
                />
                {p.isPlaying && (
                  <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/45">
                    <Eq playing={p.isPlaying} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">
                  {t.title}
                </div>
                {isWebTrack ? (
                  <div className="block truncate text-xs text-mist">
                    {t.artist} · нажми, чтобы открыть
                  </div>
                ) : (
                  <Link
                    href={t.artistHandle ? `/artist/${t.artistHandle}` : "#"}
                    className="block truncate text-xs text-mist transition-colors hover:text-accent"
                  >
                    {t.artist}
                  </Link>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(t);
                }}
                className={cn(
                  "ml-1 shrink-0 rounded-full p-2 transition-all hover:scale-110",
                  liked ? "text-accent" : "text-faint hover:text-accent",
                )}
                aria-label="Лайк"
              >
                <Heart size={17} fill={liked ? "currentColor" : "none"} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-faint">
              <div className="grid h-[52px] w-[52px] place-items-center rounded-lg border border-dashed border-line">
                <ListMusic size={18} />
              </div>
              <p className="text-xs">Выбери трек, чтобы начать волну</p>
            </div>
          )}
        </div>

        {/* center: transport controls */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={p.toggleShuffle}
              className={cn(
                "rounded-full p-2 transition-colors",
                p.shuffle ? "text-accent" : "text-faint hover:text-ink",
              )}
              aria-label="Перемешать"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={p.prev}
              className="rounded-full p-2 text-mist transition-all hover:scale-110 hover:text-ink"
              aria-label="Назад"
            >
              <SkipBack size={19} fill="currentColor" />
            </button>
            <button
              onClick={p.toggle}
              disabled={!t || isWebTrack}
              className="grid h-11 w-11 scale-100 place-items-center rounded-full bg-accent text-black shadow-[0_0_20px_rgba(0,224,101,0.45)] transition-all hover:scale-105 disabled:opacity-30 disabled:shadow-none"
              aria-label={p.isPlaying ? "Пауза" : "Играть"}
            >
              {p.isPlaying ? (
                <Pause size={19} fill="currentColor" />
              ) : (
                <Play size={19} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={p.next}
              className="rounded-full p-2 text-mist transition-all hover:scale-110 hover:text-ink"
              aria-label="Вперёд"
            >
              <SkipForward size={19} fill="currentColor" />
            </button>
            <button
              onClick={p.cycleRepeat}
              className={cn(
                "rounded-full p-2 transition-colors",
                p.repeat > 0 ? "text-accent" : "text-faint hover:text-ink",
              )}
              aria-label="Повтор"
            >
              {p.repeat === 2 ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-faint">
            <span>{fmtDuration(p.currentTime)}</span>
            <span className="text-line">/</span>
            <span>{fmtDuration(p.duration || (t?.duration ?? 0))}</span>
          </div>
        </div>

        {/* right: volume */}
        <div className="flex items-center justify-end gap-2">
          {p.isPlaying && <Eq playing />}
          <button
            onClick={p.toggleMute}
            className="rounded-full p-2 text-mist transition-colors hover:text-ink"
            aria-label="Звук"
          >
            {p.muted || p.volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.muted ? 0 : p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="w-24"
            style={{ ["--fill" as string]: `${(p.muted ? 0 : p.volume) * 100}%` }}
            aria-label="Громкость"
          />
        </div>
      </div>
    </div>
  );
}
