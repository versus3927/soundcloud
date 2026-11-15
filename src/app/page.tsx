import Link from "next/link";
import { Flame, Radio, Sparkles } from "lucide-react";
import { audius, normalizeTrack } from "@/lib/audius";
import { TrackCard } from "@/components/track-card";
import { TrackList } from "@/components/track-row";
import { Artwork } from "@/components/artwork";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const GENRES = [
  "Все",
  "Electronic",
  "Hip-Hop/Rap",
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "Trap",
  "Lo-Fi",
  "Pop",
  "Rock",
  "Ambient",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre } = await searchParams;
  const activeGenre = genre && genre !== "Все" ? genre : undefined;

  const [trending, playlists] = await Promise.all([
    audius.trending("week", activeGenre, 44),
    audius.trendingPlaylists(),
  ]);

  const tracks = (trending ?? [])
    .filter((t) => t.is_streamable !== false)
    .map(normalizeTrack);
  const spotlight = tracks.slice(0, 5);
  const grid = tracks.slice(5, 29);
  const pls = (playlists ?? []).slice(0, 8);

  return (
    <div className="px-8 pt-8 pb-12">
      {/* ── hero ── */}
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent-soft via-panel to-bg p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(45% 70% at 80% 20%, rgba(0,224,101,0.16), transparent 65%)",
          }}
        />
        {/* decorative waveform bars */}
        <div className="pointer-events-none absolute right-10 bottom-6 hidden items-end gap-1 lg:flex">
          {Array.from({ length: 48 }).map((_, i) => (
            <span
              key={i}
              className="eq-bar w-[5px] rounded-t-full bg-accent/25"
              style={{
                height: `${18 + Math.abs(Math.sin(i * 0.55)) * 90}px`,
                animationDelay: `${i * 0.07}s`,
                animationDuration: `${0.8 + (i % 5) * 0.13}s`,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-black/30 px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
            <Sparkles size={13} />
            Открытая сеть Audius
          </div>
          <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-black tracking-tight text-ink md:text-6xl">
            Музыка течёт.
            <br />
            <span className="text-accent text-glow">Без границ.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mist">
            Тренды, поиск, лайки и плейлисты — всё как ты любишь, в зелёном и без
            VPN. Стрим идёт напрямую из децентрализованной сети Audius.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <Link
              href="/search"
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(0,224,101,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_44px_rgba(0,224,101,0.6)]"
            >
              Найти трек
            </Link>
            <Link
              href="/library"
              className="rounded-full border border-line bg-black/30 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent"
            >
              Моя библиотека
            </Link>
          </div>
        </div>
      </section>

      {/* ── genre chips ── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Flame size={16} className="mr-1 text-accent" />
        {GENRES.map((g) => {
          const active = g === "Все" ? !activeGenre : activeGenre === g;
          return (
            <Link
              key={g}
              href={g === "Все" ? "/" : `/?genre=${encodeURIComponent(g)}`}
              scroll={false}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all",
                active
                  ? "border-accent bg-accent-soft text-accent shadow-[0_0_16px_rgba(0,224,101,0.25)]"
                  : "border-line bg-panel text-mist hover:border-accent/40 hover:text-ink",
              )}
            >
              {g}
            </Link>
          );
        })}
      </div>

      {tracks.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line py-24 text-center">
          <Radio className="mb-3 text-faint" size={28} />
          <p className="text-sm text-mist">
            Сеть Audius сейчас не отвечает. Попробуй обновить страницу чуть позже.
          </p>
        </div>
      ) : (
        <>
          {/* ── top 5 ── */}
          <section className="mb-12">
            <h2 className="font-display mb-4 text-xl font-bold tracking-tight text-ink">
              Топ-5 недели
            </h2>
            <div className="rounded-2xl border border-line bg-panel/60 p-2">
              <TrackList tracks={spotlight.length > 0 ? spotlight : tracks.slice(0, 5)} />
            </div>
          </section>

          {/* ── grid ── */}
          <section className="mb-12">
            <h2 className="font-display mb-4 text-xl font-bold tracking-tight text-ink">
              В тренде{activeGenre ? ` · ${activeGenre}` : ""}
            </h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {grid.map((t, i) => (
                <TrackCard key={t.id} track={t} tracks={tracks} index={i + 5} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── trending playlists ── */}
      {pls.length > 0 && (
        <section>
          <h2 className="font-display mb-4 text-xl font-bold tracking-tight text-ink">
            Подборки сообщества
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {pls.map((pl) => (
              <Link
                key={pl.id}
                href={`/discover/${pl.id}`}
                className="group fade-up"
              >
                <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-line">
                  <Artwork
                    src={pl.artwork?.["480x480"] ?? pl.artwork?.["150x150"]}
                    alt={pl.playlist_name}
                    size={240}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 text-[11px] font-medium text-emerald-100">
                    {pl.track_count} треков
                  </div>
                </div>
                <div className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent">
                  {pl.playlist_name}
                </div>
                <div className="truncate text-xs text-mist">{pl.user?.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
