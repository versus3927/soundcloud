"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  Cloud,
  Download,
  Heart,
  Link2,
  LoaderCircle,
  Pencil,
  Unlink,
  UserRound,
  X,
} from "lucide-react";
import { fmtCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Profile {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  audiusHandle: string | null;
  audiusName: string | null;
  linkedAt: string | null;
  waveProfileUrl: string | null;
  waveUsername: string | null;
  waveAvatarUrl: string | null;
  waveLinkedAt: string | null;
  stats: { likes: number; playlists: number };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetchError, setFetchError] = useState("");

  // Name edit
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  // Audius link
  const [handle, setHandle] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Wave profile link
  const [scUrl, setScUrl] = useState("");
  const [scLinking, setScLinking] = useState(false);

  // Import likes
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; message?: string } | null>(null);
  const [importError, setImportError] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const load = () => {
    setFetchError("");
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((p: Profile) => {
        setProfile(p);
        setName(p.displayName);
        setImportUrl(p.waveProfileUrl ?? "");
      })
      .catch((e: Error) => setFetchError(e.message));
  };

  useEffect(load, []);

  const saveName = async () => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name }),
    });
    if (res.ok) {
      setEditName(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
      load();
    }
  };

  const linkAudius = async () => {
    if (!handle.trim()) return;
    setLinking(true);
    setLinkError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audiusHandle: handle }),
    });
    setLinking(false);
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setLinkError(j.error ?? "Не найдено");
      return;
    }
    setHandle("");
    load();
  };

  const unlinkAudius = async () => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audiusHandle: null }),
    });
    load();
  };

  const linkWave = async () => {
    if (!scUrl.trim()) return;
    setScLinking(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waveProfileUrl: scUrl.trim() }),
    });
    setScLinking(false);
    setImportUrl(scUrl.trim());
    load();
  };

  const unlinkWave = async () => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waveProfileUrl: null }),
    });
    setScUrl("");
    setImportUrl("");
    load();
  };

  const importLikes = async () => {
    const url = importUrl.trim() || profile?.waveProfileUrl?.trim();
    if (!url) return;
    setImporting(true);
    setImportError("");
    setImportResult(null);
    try {
      const res = await fetch("/api/wave/import-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl: url }),
      });
      const j = await res.json();
      if (!res.ok) {
        setImportError(j.error ?? "Ошибка импорта");
      } else {
        setImportResult(j);
        load();
      }
    } catch {
      setImportError("Ошибка соединения");
    } finally {
      setImporting(false);
    }
  };

  if (fetchError) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-red-300">Ошибка загрузки профиля</p>
          <p className="mb-4 text-xs text-faint">{fetchError}</p>
          <button
            onClick={load}
            className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-black"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid h-full place-items-center">
        <div className="flex items-center gap-3 text-sm text-mist">
          <LoaderCircle size={18} className="animate-spin text-accent" />
          Загружаем профиль…
        </div>
      </div>
    );
  }

  const effectiveAvatar = profile.waveAvatarUrl ?? profile.avatarUrl;

  return (
    <>
      <div className="mx-auto max-w-3xl px-8 pt-10 pb-12">

        {/* Identity */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent-soft via-panel to-bg p-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(50% 60% at 85% 15%, rgba(0,224,101,0.14), transparent 65%)" }}
          />
          <div className="relative flex items-center gap-6">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-accent/40 bg-surface text-accent shadow-[0_0_40px_rgba(0,224,101,0.3)]">
              {effectiveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={effectiveAvatar} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <UserRound size={38} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {editName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="rounded-xl border border-accent/50 bg-black/40 px-3 py-1.5 text-xl font-bold text-ink outline-none"
                  />
                  <button onClick={saveName} className="rounded-full bg-accent p-2 text-black">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditName(false)} className="rounded-full p-2 text-faint hover:text-ink">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditName(true)} className="group flex items-center gap-2">
                  <h1 className="font-display truncate text-3xl font-black tracking-tight text-ink">
                    {profile.displayName}
                  </h1>
                  <Pencil size={15} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              {savedFlash && <div className="mt-1 text-xs text-accent">Сохранено ✓</div>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-mist">
                <span>
                  <b className="text-ink">{profile.stats.likes}</b> лайков
                </span>
                <span className="text-line">·</span>
                <span>
                  <b className="text-ink">{profile.stats.playlists}</b> плейлистов
                </span>
                {profile.waveUsername && (
                  <>
                    <span className="text-line">·</span>
                    <span className="flex items-center gap-1 text-[#ff5500]">
                      <Cloud size={12} /> @{profile.waveUsername}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* External profile block */}
        <section className="mb-8 rounded-3xl border border-line bg-panel/70 p-8">
          <div className="mb-1 flex items-center gap-2">
            <Cloud size={17} className="text-[#ff5500]" />
            <h2 className="font-display text-lg font-bold tracking-tight">Внешний профиль</h2>
          </div>
          <p className="mb-5 text-[13px] text-mist">
            Введи ссылку на публичный профиль. Это даёт кнопку{" "}
            <b className="text-ink">«Перенести лайки»</b> — избранные треки попадут в библиотеку VERSUSCLOUD.
          </p>

          {profile.waveProfileUrl ? (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ff5500]/25 bg-[#ff5500]/8 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#ff5500]/30 bg-surface">
                <Cloud size={20} className="text-[#ff5500]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  @{profile.waveUsername}
                  <BadgeCheck size={14} className="text-[#ff5500]" />
                </div>
                <a
                  href={profile.waveProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#ff5500] hover:underline"
                >
                  Открыть источник
                </a>
              </div>
              <button
                onClick={unlinkWave}
                className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-mist hover:border-red-400/50 hover:text-red-300"
              >
                <Unlink size={12} /> Отвязать
              </button>
            </div>
          ) : (
            <div className="mb-5 flex gap-2">
              <input
                value={scUrl}
                onChange={(e) => setScUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && linkWave()}
                placeholder="https://site.com/твой-ник"
                className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-ink outline-none focus:border-[#ff5500]/50"
              />
              <button
                onClick={linkWave}
                disabled={scLinking || !scUrl.trim()}
                className="rounded-full bg-[#ff5500] px-5 text-sm font-bold text-white disabled:opacity-40"
              >
                {scLinking ? "…" : "Привязать"}
              </button>
            </div>
          )}

          {/* Import Likes */}
          <div className="rounded-2xl border border-line bg-surface/60 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <Heart size={15} className="text-[#ff5500]" />
              Перенести лайки
            </div>
            <p className="mb-4 text-xs text-mist">
              Вставь ссылку на любой <b className="text-ink">публичный</b> профиль.
              Все лайки появятся в <b className="text-ink">Библиотеке → Лайки</b>.
            </p>
            <div className="flex gap-2">
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://site.com/username"
                className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-ink outline-none focus:border-[#ff5500]/50"
              />
              <button
                onClick={importLikes}
                disabled={importing || !importUrl.trim()}
                className="flex items-center gap-2 rounded-full bg-[#ff5500] px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,85,0,0.3)] transition-all hover:scale-105 disabled:opacity-40 disabled:shadow-none"
              >
                {importing ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {importing ? "Импорт…" : "Перенести лайки"}
              </button>
            </div>

            {importing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-mist">
                <LoaderCircle size={15} className="animate-spin text-[#ff5500]" />
                Загружаем лайки…
              </div>
            )}

            {importResult && (
              <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-4">
                <div className="font-semibold text-accent">
                  ✓ Перенесено {importResult.imported} из {importResult.total} лайков
                </div>
                {importResult.message && (
                  <div className="mt-1 text-xs text-mist">{importResult.message}</div>
                )}
                <Link
                  href="/library"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  Открыть библиотеку →
                </Link>
              </div>
            )}

            {importError && (
              <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
                {importError}
              </div>
            )}
          </div>
        </section>

        {/* Audius */}
        <section className="rounded-3xl border border-line bg-panel/70 p-8">
          <div className="mb-1 flex items-center gap-2">
            <Link2 size={17} className="text-accent" />
            <h2 className="font-display text-lg font-bold tracking-tight">Audius · без VPN</h2>
          </div>
          <p className="mb-5 text-[13px] text-mist">
            Привяжи Audius-аккаунт чтобы подтянуть аватар и имя. Audius — открытая сеть, на которой работает поиск треков.
          </p>
          {profile.audiusHandle ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-accent/25 bg-accent-soft/50 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <span>{profile.audiusName}</span>
                  <BadgeCheck size={14} className="text-accent" />
                </div>
                <Link href={`/artist/${profile.audiusHandle}`} className="text-xs text-accent hover:underline">
                  @{profile.audiusHandle}
                </Link>
              </div>
              <button
                onClick={unlinkAudius}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-mist hover:border-red-400/50 hover:text-red-300"
              >
                <Unlink size={12} /> Отвязать
              </button>
            </div>
          ) : (
            <div>
              <div className="flex max-w-md gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint">@</span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && linkAudius()}
                    placeholder="твой-хендл"
                    className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-8 text-sm text-ink outline-none focus:border-accent/60"
                  />
                </div>
                <button
                  onClick={linkAudius}
                  disabled={linking || !handle.trim()}
                  className="rounded-full bg-accent px-5 text-sm font-bold text-black disabled:opacity-40"
                >
                  {linking ? "…" : "Привязать"}
                </button>
              </div>
              {linkError && <p className="mt-2 text-xs text-red-300">{linkError}</p>}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: "Лайков", value: fmtCount(profile.stats.likes) },
            { label: "Плейлистов", value: fmtCount(profile.stats.playlists) },
            { label: "Сеть", value: "online", green: true },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-panel/70 p-5 text-center">
              <div className={cn("font-display text-2xl font-black", "green" in s && s.green ? "text-accent" : "text-ink")}>
                {s.value}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-faint">{s.label}</div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
