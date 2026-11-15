"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  Link2,
  Pencil,
  Unlink,
  UserRound,
} from "lucide-react";
import { fmtCount } from "@/lib/utils";

interface Profile {
  id: number;
  displayName: string;
  audiusHandle: string | null;
  audiusUserId: string | null;
  audiusName: string | null;
  avatarUrl: string | null;
  linkedAt: string | null;
  stats: { likes: number; playlists: number };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const load = () => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setName(p.displayName);
      })
      .catch(() => {});
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

  const link = async () => {
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
      const j = await res.json();
      setError(j.error ?? "Не удалось привязать профиль");
      return;
    }
    setHandle("");
    load();
  };

  const unlink = async () => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audiusHandle: null }),
    });
    load();
  };

  if (!profile) {
    return (
      <div className="grid h-full place-items-center text-sm text-mist">
        Загружаем профиль…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 pt-10 pb-12">
      {/* identity card */}
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
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
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
            <div className="mt-2 flex items-center gap-4 text-xs text-mist">
              <span>{profile.stats?.likes ?? 0} лайков</span>
              <span className="text-line">·</span>
              <span>{profile.stats?.playlists ?? 0} плейлистов</span>
              {profile.linkedAt && (
                <>
                  <span className="text-line">·</span>
                  <span className="text-accent">
                    привязан {new Date(profile.linkedAt).toLocaleDateString("ru-RU")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* linked Audius account */}
      <section className="rounded-3xl border border-line bg-panel/70 p-8">
        <div className="mb-1 flex items-center gap-2">
          <Link2 size={17} className="text-accent" />
          <h2 className="font-display text-lg font-bold tracking-tight">
            Связанный аккаунт
          </h2>
        </div>
        <p className="mb-6 max-w-lg text-[13px] leading-relaxed text-mist">
          Приложение работает через открытую сеть Audius — она доступна без VPN и
          не требует ключей. Укажи свой Audius-хендл, чтобы подтянуть аватар,
          имя и статистику профиля. Хендл можно посмотреть на{" "}
          <span className="text-accent">audius.co</span>.
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
              onClick={unlink}
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
                  onKeyDown={(e) => e.key === "Enter" && link()}
                  placeholder="твой-хендл-на-audius"
                  className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-8 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/60"
                />
              </div>
              <button
                onClick={link}
                disabled={linking || !handle.trim()}
                className="rounded-full bg-accent px-5 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-40"
              >
                {linking ? "…" : "Привязать"}
              </button>
            </div>
            {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
            <p className="mt-4 max-w-md text-[11px] leading-relaxed text-faint">
              Прямая интеграция с настоящим SoundCloud невозможна без их закрытого
              API-ключа (заявки принимают месяцами) — и он всё равно требует VPN
              в твоём регионе. Поэтому VERSUSCLOUD построен на Audius: миллионы
              треков и открытый API без ограничений.
            </p>
          </div>
        )}
      </section>

      {/* stats */}
      <section className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: "Лайков", value: fmtCount(profile.stats?.likes ?? 0) },
          { label: "Плейлистов", value: fmtCount(profile.stats?.playlists ?? 0) },
          {
            label: "Статус сети",
            value: "online",
            accent: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-panel/70 p-5 text-center"
          >
            <div
              className={`font-display text-2xl font-black ${s.accent ? "text-accent" : "text-ink"}`}
            >
              {s.value}
            </div>
            <div className="mt-1 text-[11px] tracking-wide text-faint uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
