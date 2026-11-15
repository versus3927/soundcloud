"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Check,
  Cloud,
  ExternalLink,
  Heart,
  Link2,
  LoaderCircle,
  Pencil,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Unlink,
  UserRound,
} from "lucide-react";
import { fmtCount, fmtDuration } from "@/lib/utils";

type Profile = {
  id: number;
  displayName: string;
  audiusHandle: string | null;
  audiusUserId: string | null;
  audiusName: string | null;
  avatarUrl: string | null;
  linkedAt: string | null;
  soundcloudConfigured: boolean;
  soundcloudConnected: boolean;
  soundcloudUsername?: string | null;
  soundcloudFullName?: string | null;
  soundcloudPermalinkUrl?: string | null;
  soundcloudAvatarUrl?: string | null;
  soundcloudLinkedAt?: string | null;
  stats: { likes: number; playlists: number };
};

type ScUser = {
  urn: string;
  username: string;
  full_name?: string | null;
  permalink: string;
  permalink_url: string;
  avatar_url?: string | null;
  followers_count?: number;
  followings_count?: number;
  playlist_count?: number;
  track_count?: number;
  public_favorites_count?: number;
  city?: string | null;
  country?: string | null;
};

type ScTrack = {
  urn: string;
  title: string;
  artwork_url?: string | null;
  duration?: number;
  permalink_url: string;
  playback_count?: number;
  favoritings_count?: number;
  user?: ScUser;
};

type ScPlaylist = {
  urn: string;
  title: string;
  artwork_url?: string | null;
  track_count?: number;
  permalink_url: string;
  likes_count?: number;
  user?: ScUser;
};

type SoundCloudSync = {
  configured: boolean;
  connected: boolean;
  me?: ScUser;
  likes?: ScTrack[];
  playlists?: ScPlaylist[];
  recent?: ScTrack[];
  error?: string;
};

type AuthPayload = {
  sessionId: string;
  authorizeUrl: string;
  qrDataUrl: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const [soundcloud, setSoundcloud] = useState<SoundCloudSync | null>(null);
  const [soundcloudLoading, setSoundcloudLoading] = useState(false);
  const [soundcloudError, setSoundcloudError] = useState("");
  const [authFlow, setAuthFlow] = useState<
    (AuthPayload & { status: "pending" | "completed" | "error"; error?: string }) | null
  >(null);

  const loadProfile = () => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setName(p.displayName);
      })
      .catch(() => {});
  };

  const loadSoundCloud = async () => {
    setSoundcloudLoading(true);
    setSoundcloudError("");
    try {
      const res = await fetch("/api/soundcloud/me", { cache: "no-store" });
      const json = (await res.json()) as SoundCloudSync;
      setSoundcloud(json);
      if (!res.ok && json.error) setSoundcloudError(json.error);
    } catch {
      setSoundcloudError("Не удалось синхронизироваться с SoundCloud");
    } finally {
      setSoundcloudLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.soundcloudConnected) {
      loadSoundCloud().catch(() => {});
    }
  }, [profile?.soundcloudConnected]);

  useEffect(() => {
    if (!authFlow || authFlow.status !== "pending") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/soundcloud/auth/status?sessionId=${encodeURIComponent(authFlow.sessionId)}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as {
          status: "pending" | "completed" | "error";
          error?: string;
        };
        if (json.status === "completed") {
          setAuthFlow((prev) =>
            prev ? { ...prev, status: "completed", error: undefined } : prev,
          );
          clearInterval(timer);
          loadProfile();
          loadSoundCloud().catch(() => {});
          setTimeout(() => setAuthFlow(null), 1600);
        }
        if (json.status === "error") {
          setAuthFlow((prev) =>
            prev ? { ...prev, status: "error", error: json.error } : prev,
          );
          clearInterval(timer);
        }
      } catch {
        // keep polling
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [authFlow]);

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
      loadProfile();
    }
  };

  const linkAudius = async () => {
    if (!handle.trim()) return;
    setLinking(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audiusHandle: handle }),
    });
    setLinking(false);
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? "Не удалось привязать профиль");
      return;
    }
    setHandle("");
    loadProfile();
  };

  const unlinkAudius = async () => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audiusHandle: null }),
    });
    loadProfile();
  };

  const startSoundCloudAuth = async () => {
    setSoundcloudError("");
    const res = await fetch("/api/soundcloud/auth/start", { method: "POST" });
    const json = (await res.json()) as AuthPayload & { error?: string };
    if (!res.ok) {
      setSoundcloudError(json.error ?? "Не удалось запустить вход SoundCloud");
      return;
    }
    setAuthFlow({ ...json, status: "pending" });
    window.open(
      json.authorizeUrl,
      "soundcloud-oauth",
      "popup=yes,width=520,height=760,resizable=yes,scrollbars=yes",
    );
  };

  const disconnectSoundCloud = async () => {
    await fetch("/api/soundcloud/disconnect", { method: "POST" });
    setSoundcloud(null);
    setSoundcloudError("");
    loadProfile();
  };

  const effectiveAvatar = useMemo(
    () => profile?.soundcloudAvatarUrl ?? profile?.avatarUrl ?? null,
    [profile],
  );

  if (!profile) {
    return (
      <div className="grid h-full place-items-center text-sm text-mist">
        Загружаем профиль…
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-8 pt-10 pb-12">
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent-soft via-panel to-bg p-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 60% at 85% 15%, rgba(0,224,101,0.14), transparent 65%)",
            }}
          />
          <div className="relative flex items-center gap-6">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-accent/40 bg-surface text-accent shadow-[0_0_40px_rgba(0,224,101,0.3)]">
              {effectiveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveAvatar}
                  alt={profile.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={38} />
              )}
            </div>
            <div className="min-w-0">
              {editName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="rounded-xl border border-accent/50 bg-black/40 px-3 py-1.5 text-xl font-bold text-ink outline-none"
                  />
                  <button
                    onClick={saveName}
                    className="rounded-full bg-accent p-2 text-black transition-transform hover:scale-110"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditName(true)}
                  className="group flex items-center gap-2"
                >
                  <h1 className="font-display truncate text-3xl font-black tracking-tight text-ink">
                    {profile.displayName}
                  </h1>
                  <Pencil
                    size={15}
                    className="text-faint opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              )}
              {savedFlash && (
                <div className="mt-1 text-xs text-accent">Сохранено</div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-mist">
                <span>{profile.stats?.likes ?? 0} локальных лайков</span>
                <span className="text-line">·</span>
                <span>{profile.stats?.playlists ?? 0} локальных плейлистов</span>
                {profile.soundcloudConnected && (
                  <>
                    <span className="text-line">·</span>
                    <span className="text-accent">SoundCloud connected</span>
                  </>
                )}
                {profile.linkedAt && (
                  <>
                    <span className="text-line">·</span>
                    <span>Audius linked</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-line bg-panel/70 p-8">
          <div className="mb-2 flex items-center gap-2">
            <Cloud size={17} className="text-accent" />
            <h2 className="font-display text-lg font-bold tracking-tight">
              Официальный SoundCloud Sync
            </h2>
          </div>
          <p className="mb-5 max-w-3xl text-[13px] leading-relaxed text-mist">
            Здесь подключается именно <span className="text-accent">официальный SoundCloud OAuth 2.1</span>.
            У SoundCloud нет отдельного device-code API или “встроенного QR-логина”,
            поэтому QR ниже открывает официальный экран авторизации SoundCloud на телефоне.
            После подтверждения VERSUSCLOUD получает доступ к <code>/me</code>, лайкам,
            плейлистам и recent plays.
          </p>

          {!profile.soundcloudConfigured && (
            <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
              На Railway нужно добавить переменные: <b>SOUNDCLOUD_CLIENT_ID</b>, <b>SOUNDCLOUD_CLIENT_SECRET</b>, <b>SOUNDCLOUD_REDIRECT_URI</b>.
              Redirect URI должен указывать на <span className="text-white">https://versuscloud.up.railway.app/api/soundcloud/callback</span>
            </div>
          )}

          {profile.soundcloudConnected ? (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-accent/25 bg-accent-soft/50 p-5">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-accent/40 bg-surface">
                  {soundcloud?.me?.avatar_url || profile.soundcloudAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={soundcloud?.me?.avatar_url || profile.soundcloudAvatarUrl || ""}
                      alt={soundcloud?.me?.full_name || soundcloud?.me?.username || "SoundCloud"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Cloud size={24} className="text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <span className="truncate">
                      {soundcloud?.me?.full_name || profile.soundcloudFullName || profile.soundcloudUsername}
                    </span>
                    <ShieldCheck size={15} className="text-accent" />
                  </div>
                  <div className="text-xs text-mist">
                    @{soundcloud?.me?.username || profile.soundcloudUsername}
                  </div>
                  {soundcloud?.me?.permalink_url || profile.soundcloudPermalinkUrl ? (
                    <a
                      href={soundcloud?.me?.permalink_url || profile.soundcloudPermalinkUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Открыть официальный профиль <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
                <button
                  onClick={() => loadSoundCloud()}
                  disabled={soundcloudLoading}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-mist transition-colors hover:border-accent/40 hover:text-ink disabled:opacity-50"
                >
                  {soundcloudLoading ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Обновить sync
                </button>
                <button
                  onClick={disconnectSoundCloud}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-mist transition-colors hover:border-red-400/50 hover:text-red-300"
                >
                  <Unlink size={13} /> Отключить
                </button>
              </div>

              {soundcloudError && (
                <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {soundcloudError}
                </div>
              )}

              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {
                    label: "Followers",
                    value: fmtCount(soundcloud?.me?.followers_count ?? 0),
                  },
                  {
                    label: "Likes",
                    value: fmtCount(soundcloud?.me?.public_favorites_count ?? 0),
                  },
                  {
                    label: "Playlists",
                    value: fmtCount(soundcloud?.me?.playlist_count ?? 0),
                  },
                  {
                    label: "Tracks",
                    value: fmtCount(soundcloud?.me?.track_count ?? 0),
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-line bg-surface/70 p-5 text-center"
                  >
                    <div className="font-display text-2xl font-black text-ink">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[11px] tracking-wide text-faint uppercase">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <ScTrackColumn
                  title="Liked tracks"
                  icon={<Heart size={15} className="text-accent" />}
                  tracks={soundcloud?.likes ?? []}
                  empty="У SoundCloud-аккаунта пока нет лайков или API не вернул их."
                />
                <ScPlaylistColumn
                  title="Playlists"
                  playlists={soundcloud?.playlists ?? []}
                />
                <ScTrackColumn
                  title="Recently played"
                  icon={<RefreshCw size={15} className="text-accent" />}
                  tracks={soundcloud?.recent ?? []}
                  empty="Недавние прослушивания ещё не появились."
                />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-line bg-surface/60 p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={startSoundCloudAuth}
                  disabled={!profile.soundcloudConfigured}
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-45"
                >
                  Войти через SoundCloud
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-mist">
                  <QrCode size={14} className="text-accent" />
                  QR для входа с телефона
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-mist">
                  <Smartphone size={14} className="text-accent" />
                  Официальный экран authorize
                </div>
              </div>
              <p className="max-w-2xl text-sm text-mist">
                Нажми кнопку — откроется официальный SoundCloud login в popup.
                Если удобнее, отсканируй QR с телефона: после подтверждения сайт на ПК
                сам увидит, что вход завершён, и подтянет данные из <code>/me</code>.
              </p>
              {soundcloudError && (
                <p className="mt-4 text-sm text-red-300">{soundcloudError}</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-panel/70 p-8">
          <div className="mb-1 flex items-center gap-2">
            <Link2 size={17} className="text-accent" />
            <h2 className="font-display text-lg font-bold tracking-tight">
              Audius / без VPN
            </h2>
          </div>
          <p className="mb-6 max-w-lg text-[13px] leading-relaxed text-mist">
            Это альтернативная открытая сеть, на которой построен сам VERSUSCLOUD.
            Здесь удобно слушать музыку внутри приложения без ограничений API.
          </p>

          {profile.audiusHandle ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-accent/25 bg-accent-soft/50 p-5">
              <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-accent/40 bg-surface">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.audiusName ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={22} className="text-accent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <span className="truncate">{profile.audiusName}</span>
                  <BadgeCheck size={15} className="text-accent" />
                </div>
                <Link
                  href={`/artist/${profile.audiusHandle}`}
                  className="text-xs text-accent hover:underline"
                >
                  @{profile.audiusHandle} — открыть страницу
                </Link>
              </div>
              <button
                onClick={unlinkAudius}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-mist transition-colors hover:border-red-400/50 hover:text-red-300"
              >
                <Unlink size={13} /> Отвязать
              </button>
            </div>
          ) : (
            <div>
              <div className="flex max-w-md gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint">
                    @
                  </span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && linkAudius()}
                    placeholder="твой-хендл-на-audius"
                    className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-8 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/60"
                  />
                </div>
                <button
                  onClick={linkAudius}
                  disabled={linking || !handle.trim()}
                  className="rounded-full bg-accent px-5 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-40"
                >
                  {linking ? "…" : "Привязать"}
                </button>
              </div>
              {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
            </div>
          )}
        </section>
      </div>

      {authFlow && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-accent/20 bg-panel p-6 shadow-2xl shadow-black/60">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">
                  SoundCloud connect
                </div>
                <h3 className="font-display mt-1 text-xl font-black tracking-tight text-ink">
                  Вход через QR или popup
                </h3>
              </div>
              <button
                onClick={() => setAuthFlow(null)}
                className="rounded-full border border-line px-3 py-1 text-xs text-mist hover:text-ink"
              >
                Закрыть
              </button>
            </div>

            <div className="grid place-items-center rounded-2xl border border-line bg-[#050a07] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={authFlow.qrDataUrl} alt="SoundCloud login QR" className="h-64 w-64" />
            </div>

            <div className="mt-4 space-y-2 text-sm text-mist">
              <p>
                1. Сканируй QR телефоном или нажми кнопку ниже.
              </p>
              <p>
                2. Войди в официальный SoundCloud и подтверди доступ.
              </p>
              <p>
                3. VERSUSCLOUD автоматически увидит завершение входа.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={authFlow.authorizeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-black"
              >
                Открыть SoundCloud <ExternalLink size={14} />
              </a>
              <div className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-mist">
                {authFlow.status === "pending" ? (
                  <LoaderCircle size={13} className="animate-spin text-accent" />
                ) : authFlow.status === "completed" ? (
                  <Check size={13} className="text-accent" />
                ) : (
                  <Unlink size={13} className="text-red-300" />
                )}
                {authFlow.status === "pending"
                  ? "Ждём подтверждение..."
                  : authFlow.status === "completed"
                    ? "Подключено"
                    : authFlow.error || "Ошибка входа"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArtworkBox({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface text-accent">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Cloud size={18} />
      )}
    </div>
  );
}

function ScTrackColumn({
  title,
  icon,
  tracks,
  empty,
}: {
  title: string;
  icon: ReactNode;
  tracks: ScTrack[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {tracks.length === 0 && <p className="text-xs text-faint">{empty}</p>}
        {tracks.slice(0, 8).map((t) => (
          <a
            key={t.urn}
            href={t.permalink_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-elev"
          >
            <ArtworkBox src={t.artwork_url} alt={t.title} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{t.title}</div>
              <div className="truncate text-xs text-faint">
                {t.user?.username || "SoundCloud"}
              </div>
            </div>
            <div className="text-right text-[10px] text-faint">
              <div>{fmtDuration((t.duration ?? 0) / 1000)}</div>
              <div>{fmtCount(t.playback_count ?? 0)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ScPlaylistColumn({
  title,
  playlists,
}: {
  title: string;
  playlists: ScPlaylist[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Link2 size={15} className="text-accent" />
        {title}
      </div>
      <div className="space-y-2">
        {playlists.length === 0 && (
          <p className="text-xs text-faint">Плейлисты аккаунта пока не подтянулись.</p>
        )}
        {playlists.slice(0, 8).map((pl) => (
          <a
            key={pl.urn}
            href={pl.permalink_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-elev"
          >
            <ArtworkBox src={pl.artwork_url} alt={pl.title} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{pl.title}</div>
              <div className="truncate text-xs text-faint">
                {pl.user?.username || "SoundCloud"}
              </div>
            </div>
            <div className="text-right text-[10px] text-faint">
              <div>{pl.track_count ?? 0} tracks</div>
              <div>{fmtCount(pl.likes_count ?? 0)} likes</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
