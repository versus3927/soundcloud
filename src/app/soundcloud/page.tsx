"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Cloud,
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
  Music,
  QrCode,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { cn, fmtDuration } from "@/lib/utils";

interface EmbedItem {
  id: string;
  url: string;
  title: string;
  authorName: string;
  thumbnailUrl: string | null;
  html: string;
}

interface SearchResult {
  id: number;
  title: string;
  url: string;
  author: string;
  artwork: string | null;
  duration: number;
}

const POPULAR_LINKS = [
  { label: "Playboi Carti", url: "https://soundcloud.com/playboicarti" },
  { label: "Lil Uzi Vert", url: "https://soundcloud.com/liluzivert" },
  { label: "Travis Scott", url: "https://soundcloud.com/travisscott" },
  { label: "Juice WRLD", url: "https://soundcloud.com/uiceheidd" },
  { label: "deadmau5", url: "https://soundcloud.com/deadmau5" },
  { label: "Skrillex", url: "https://soundcloud.com/skaborofficial" },
];

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WavePageContent() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [embeds, setEmbeds] = useState<EmbedItem[]>([]);
  const [activeEmbed, setActiveEmbed] = useState<EmbedItem | null>(null);
  
  const searchParams = useSearchParams();

  // QR Transfer State
  const [remoteCode, setRemoteCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrQrModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vc-sc-embeds");
      if (saved) setEmbeds(JSON.parse(saved));
    } catch {}
  }, []);

  const saveEmbeds = useCallback((items: EmbedItem[]) => {
    setEmbeds(items);
    localStorage.setItem("vc-sc-embeds", JSON.stringify(items.slice(0, 50)));
  }, []);

  const loadEmbed = useCallback(
    async (url: string) => {
      setLoading(true);
      setError("");
      setSearchResults([]);
      try {
        const res = await fetch(`/api/soundcloud/oembed?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Ошибка загрузки");

        const item: EmbedItem = {
          id: `${Date.now()}`,
          url,
          title: json.title,
          authorName: json.author_name,
          thumbnailUrl: json.thumbnail_url,
          html: json.html.replace(/src="([^"]+)"/, (_match: string, src: string) => `src="${src}${src.includes("?") ? "&" : "?"}auto_play=true"`),
        };

        setActiveEmbed(item);
        saveEmbeds([item, ...embeds.filter((e) => e.url !== url)]);
        setInput("");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [embeds, saveEmbeds],
  );

  // Auto-load track if ?play= URL param exists
  useEffect(() => {
    const playUrl = searchParams.get("play");
    if (playUrl) {
      loadEmbed(playUrl);
      // Optional: remove the param so it doesn't reload on refresh, but let's keep it simple for now
    }
  }, [searchParams, loadEmbed]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;

    if (q.startsWith("http")) {
      loadEmbed(q);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/soundcloud/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSearchResults(json.results || []);
      if (json.results?.length === 0) setError("Ничего не найдено");
    } catch {
      setError("Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  // Start Remote Session
  const initRemote = async () => {
    if (remoteCode) {
      setShowQrQrModal(true);
      return;
    }
    const res = await fetch("/api/soundcloud/remote", { method: "POST" });
    const { code } = await res.json();
    setRemoteCode(code);
    const remoteUrl = `${window.location.origin}/remote/${code}`;
    const qr = await QRCode.toDataURL(remoteUrl, { margin: 1, width: 240, color: { dark: "#00e065", light: "#050a07" } });
    setQrDataUrl(qr);
    setShowQrQrModal(true);
  };

  // Poll for remote links
  useEffect(() => {
    if (!remoteCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/soundcloud/remote?code=${remoteCode}`);
        const json = await res.json();
        if (json.url) {
          loadEmbed(json.url);
          setShowQrQrModal(false);
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [remoteCode, loadEmbed]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-8 pt-8 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5500]/15 text-[#ff5500]">
              <Cloud size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight">Wave</h1>
              <p className="text-xs text-mist">Поиск по названию или ссылке. Работает без VPN.</p>
            </div>
          </div>
          <button
            onClick={initRemote}
            className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-4 py-2 text-xs font-bold text-accent transition-all hover:border-accent/40"
          >
            <QrCode size={14} /> Отправить с телефона
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Название трека или ссылка..."
              className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-sm text-ink outline-none focus:border-[#ff5500]/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#ff5500] px-8 text-sm font-bold text-white shadow-lg disabled:opacity-40"
          >
            Найти
          </button>
        </form>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_LINKS.map((link) => (
            <button
              key={link.url}
              onClick={() => loadEmbed(link.url)}
              className="rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-medium text-mist hover:text-ink"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 px-8 pb-8">
        <div className="flex min-w-0 flex-1 flex-col">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((res) => (
                <div
                  key={res.id}
                  onClick={() => loadEmbed(res.url)}
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-all hover:border-accent/30 hover:bg-elev"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={res.artwork || ""} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink">{res.title}</div>
                    <div className="truncate text-[11px] text-faint">{res.author}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeEmbed ? (
            <div className="fade-up flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold text-ink">{activeEmbed.title}</div>
                  <div className="truncate text-sm text-mist">{activeEmbed.authorName}</div>
                </div>
                <button onClick={() => setActiveEmbed(null)} className="rounded-full p-2 text-faint hover:text-ink">
                  <X size={16} />
                </button>
              </div>
              <div
                className="w-full overflow-hidden rounded-2xl border border-line"
                dangerouslySetInnerHTML={{ __html: activeEmbed.html }}
              />
            </div>
          ) : (
            <div className="grid flex-1 place-items-center rounded-3xl border border-dashed border-line">
              <div className="text-center">
                <Music size={32} className="mx-auto mb-3 text-faint" />
                <p className="text-sm text-mist">Введи название выше, чтобы найти трек</p>
              </div>
            </div>
          )}
        </div>

        {embeds.length > 0 && (
          <div className="hidden w-64 shrink-0 flex-col lg:flex">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Недавние</span>
              <button onClick={() => saveEmbeds([])} className="text-faint hover:text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto pr-1">
              {embeds.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setActiveEmbed(e)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors",
                    activeEmbed?.id === e.id ? "bg-accent-soft ring-1 ring-accent/20" : "hover:bg-surface",
                  )}
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.thumbnailUrl || ""} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 truncate text-xs text-ink">{e.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-panel p-8 text-center">
            <h3 className="font-display mb-2 text-xl font-black">Remote Link</h3>
            <p className="mb-6 text-xs text-mist">Отсканируй QR телефоном и вставь ссылку — музыка сразу заиграет на ПК.</p>
            <div className="mx-auto mb-6 grid h-64 w-64 place-items-center rounded-2xl bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="h-full w-full" />}
            </div>
            <button
              onClick={() => setShowQrQrModal(false)}
              className="w-full rounded-2xl bg-surface py-3 text-sm font-bold text-ink"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WavePage() {
  return (
    <Suspense fallback={null}>
      <WavePageContent />
    </Suspense>
  );
}
