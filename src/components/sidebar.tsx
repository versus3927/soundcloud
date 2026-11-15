"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AudioWaveform,
  Cloud,
  Compass,
  Heart,
  Home,
  ListMusic,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { usePlaylists } from "@/components/providers";
import { Artwork } from "@/components/artwork";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/soundcloud", label: "SoundCloud", icon: Cloud },
  { href: "/library", label: "Библиотека", icon: Heart },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { playlists, create } = usePlaylists();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    const pl = await create(n);
    setName("");
    setCreating(false);
    if (pl) router.push(`/playlist/${pl.id}`);
  };

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-line bg-panel">
      {/* logo */}
      <Link href="/" className="group flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-black shadow-[0_0_24px_rgba(0,224,101,0.4)] transition-transform group-hover:rotate-6">
          <AudioWaveform size={22} strokeWidth={2.4} />
        </div>
        <div>
          <div className="font-display text-[15px] font-bold tracking-tight text-ink">
            VERSUS<span className="text-accent">CLOUD</span>
          </div>
          <div className="text-[10px] tracking-[0.22em] text-faint uppercase">
            sound, no borders
          </div>
        </div>
      </Link>

      {/* nav */}
      <nav className="space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-accent-soft text-accent shadow-[inset_2px_0_0_0_var(--color-accent)]"
                  : "text-mist hover:bg-surface hover:text-ink",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* playlists */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">
            Плейлисты
          </span>
          <button
            onClick={() => setCreating((c) => !c)}
            className="rounded-full p-1.5 text-mist transition-all hover:bg-accent-soft hover:text-accent"
            aria-label="Новый плейлист"
          >
            <Plus size={15} />
          </button>
        </div>

        {creating && (
          <div className="mb-2 px-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setCreating(false);
              }}
              placeholder="Название плейлиста…"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/60"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-4">
          {playlists.length === 0 && !creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line px-3 py-3 text-left text-xs text-faint transition-colors hover:border-accent/40 hover:text-mist"
            >
              <ListMusic size={15} />
              Создай первый плейлист
            </button>
          )}
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/playlist/${pl.id}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
                pathname === `/playlist/${pl.id}`
                  ? "bg-accent-soft"
                  : "hover:bg-surface",
              )}
            >
              <Artwork
                src={pl.effectiveCover}
                alt={pl.name}
                size={34}
                className="rounded-md"
              />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-ink">
                  {pl.name}
                </div>
                <div className="text-[11px] text-faint">
                  {pl.trackCount} {plural(pl.trackCount)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* footer hint */}
        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-2 text-[10px] text-faint">
            <Compass size={12} className="text-accent/70" />
            Работает без VPN · сеть Audius
          </div>
        </div>
      </div>
    </aside>
  );
}

function plural(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "трек";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "трека";
  return "треков";
}
