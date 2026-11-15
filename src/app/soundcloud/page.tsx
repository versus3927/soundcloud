"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Cloud,
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
  Music,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmbedItem {
  id: string;
  url: string;
  title: string;
  authorName: string;
  thumbnailUrl: string | null;
  html: string;
}

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  error?: string;
}

const POPULAR_LINKS = [
  {
    label: "Playboi Carti",
    url: "https://soundcloud.com/playboicarti",
  },
  {
    label: "Lil Uzi Vert",
    url: "https://soundcloud.com/liluzivert",
  },
  {
    label: "Travis Scott",
    url: "https://soundcloud.com/travisscott",
  },
  {
    label: "Juice WRLD",
    url: "https://soundcloud.com/uiceheidd",
  },
  {
    label: "deadmau5",
    url: "https://soundcloud.com/deadmau5",
  },
  {
    label: "Skrillex",
    url: "https://soundcloud.com/skaborofficial",
  },
];

export default function SoundCloudPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [embeds, setEmbeds] = useState<EmbedItem[]>([]);
  const [activeEmbed, setActiveEmbed] = useState<EmbedItem | null>(null);
  const iframeRef = useRef<HTMLDivElement>(null);

  // Load saved embeds from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vc-sc-embeds");
      if (saved) setEmbeds(JSON.parse(saved));
    } catch {}
  }, []);

  const saveEmbeds = useCallback((items: EmbedItem[]) => {
    setEmbeds(items);
    try {
      localStorage.setItem("vc-sc-embeds", JSON.stringify(items.slice(0, 50)));
    } catch {}
  }, []);

  const loadEmbed = useCallback(
    async (inputUrl: string) => {
      const trimmed = inputUrl.trim();
      if (!trimmed) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/soundcloud/oembed?url=${encodeURIComponent(trimmed)}`,
        );
        const json = (await res.json()) as OEmbedResponse;
        if (!res.ok || json.error) {
          setError(json.error || "Не удалось загрузить");
          return;
        }
        if (!json.html) {
          setError("SoundCloud не вернул embed-код для этой ссылки");
          return;
        }

        // Make widget dark and green-themed
        let embedHtml = json.html
          .replace(/color=%23[a-fA-F0-9]{6}/g, "color=%2300e065")
          .replace(
            /visual=true/g,
            "visual=false",
          );
        // Ensure auto_play
        if (!embedHtml.includes("auto_play=true")) {
          embedHtml = embedHtml.replace(
            /src="([^"]+)"/,
            (_, src: string) =>
              `src="${src}${src.includes("?") ? "&" : "?"}auto_play=true"`,
          );
        }

        const item: EmbedItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: trimmed,
          title: json.title || "Без названия",
          authorName: json.author_name || "SoundCloud",
          thumbnailUrl: json.thumbnail_url || null,
          html: embedHtml,
        };

        setActiveEmbed(item);
        // Add to history (avoid duplicates by URL)
        saveEmbeds([
          item,
          ...embeds.filter((e) => e.url !== trimmed),
        ]);
        setUrl("");
      } catch {
        setError("Ошибка соединения");
      } finally {
        setLoading(false);
      }
    },
    [embeds, saveEmbeds],
  );

  const removeEmbed = (id: string) => {
    const updated = embeds.filter((e) => e.id !== id);
    saveEmbeds(updated);
    if (activeEmbed?.id === id) setActiveEmbed(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5500]/15 text-[#ff5500]">
            <Cloud size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight">
              SoundCloud
            </h1>
            <p className="text-xs text-mist">
              Вставь ссылку на трек или плейлист — он заиграет прямо здесь. Без VPN, без API-ключей.
            </p>
          </div>
        </div>

        {/* URL input */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            loadEmbed(url);
          }}
        >
          <div className="relative flex-1">
            <LinkIcon
              size={16}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://soundcloud.com/artist/track-name"
              className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-sm text-ink outline-none transition-all placeholder:text-faint focus:border-[#ff5500]/50 focus:shadow-[0_0_0_3px_rgba(255,85,0,0.1)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 rounded-2xl bg-[#ff5500] px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,85,0,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,85,0,0.45)] disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Загрузить
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Quick links */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-faint">
            <Sparkles size={12} className="text-[#ff5500]/70" />
            Быстрый доступ:
          </span>
          {POPULAR_LINKS.map((link) => (
            <button
              key={link.url}
              onClick={() => loadEmbed(link.url)}
              className="rounded-full border border-line bg-panel px-3 py-1 text-[12px] font-medium text-mist transition-all hover:border-[#ff5500]/40 hover:text-ink"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex min-h-0 flex-1 gap-6 px-8 pb-8">
        {/* Active player */}
        <div className="flex min-w-0 flex-1 flex-col">
          {activeEmbed ? (
            <div className="fade-up flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold text-ink">
                    {activeEmbed.title}
                  </div>
                  <div className="truncate text-sm text-mist">
                    {activeEmbed.authorName}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={activeEmbed.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-mist transition-colors hover:border-[#ff5500]/40 hover:text-ink"
                  >
                    <ExternalLink size={12} />
                    Открыть на SoundCloud
                  </a>
                  <button
                    onClick={() => setActiveEmbed(null)}
                    className="rounded-full p-2 text-faint hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div
                ref={iframeRef}
                className="w-full overflow-hidden rounded-2xl border border-line [&_iframe]:!rounded-2xl"
                dangerouslySetInnerHTML={{ __html: activeEmbed.html }}
              />
            </div>
          ) : (
            <div className="grid flex-1 place-items-center rounded-3xl border border-dashed border-line">
              <div className="text-center">
                <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-[#ff5500]/10 text-[#ff5500]/60">
                  <Music size={32} />
                </div>
                <p className="text-sm font-semibold text-ink">
                  Вставь ссылку с SoundCloud
                </p>
                <p className="mt-1 max-w-sm text-xs text-mist">
                  Скопируй ссылку на любой трек, плейлист или артиста
                  из SoundCloud — он заиграет здесь через официальный виджет.
                  Работает без VPN и без API-ключей.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        {embeds.length > 0 && (
          <div className="hidden w-72 shrink-0 flex-col lg:flex">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">
                <Star size={11} className="mr-1.5 inline text-[#ff5500]/60" />
                Недавние
              </span>
              <button
                onClick={() => {
                  saveEmbeds([]);
                  setActiveEmbed(null);
                }}
                className="rounded-full p-1.5 text-faint transition-colors hover:text-red-300"
                title="Очистить историю"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {embeds.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveEmbed(item)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    activeEmbed?.id === item.id
                      ? "bg-[#ff5500]/10 ring-1 ring-[#ff5500]/20"
                      : "hover:bg-surface",
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-elev">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Cloud size={16} className="text-[#ff5500]/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-[13px] font-medium",
                        activeEmbed?.id === item.id
                          ? "text-[#ff5500]"
                          : "text-ink",
                      )}
                    >
                      {item.title}
                    </div>
                    <div className="truncate text-[11px] text-faint">
                      {item.authorName}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEmbed(item.id);
                    }}
                    className="shrink-0 rounded-full p-1 text-faint opacity-0 transition-all group-hover:opacity-100 hover:text-red-300"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
