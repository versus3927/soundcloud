"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, UserRound } from "lucide-react";

export function TopBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setAvatar(p.avatarUrl ?? null))
      .catch(() => {});
  }, []);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-panel/70 px-6 backdrop-blur-xl">
      <form
        className="relative w-full max-w-[520px]"
        onSubmit={(e) => {
          e.preventDefault();
          const query = q.trim();
          router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
        }}
      >
        <Search
          size={17}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Треки, артисты, плейлисты…"
          className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-sm text-ink outline-none transition-all placeholder:text-faint focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(0,224,101,0.12)]"
        />
      </form>

      <div className="flex-1" />

      <div className="hidden items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 md:flex">
        <span className="live-dot h-2 w-2 rounded-full bg-accent" />
        <span className="text-[11px] font-medium tracking-wide text-accent">
          Audius · без VPN
        </span>
      </div>

      <Link
        href="/profile"
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-line bg-surface text-mist transition-all hover:border-accent/50 hover:text-accent"
        aria-label="Профиль"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="Профиль" className="h-full w-full object-cover" />
        ) : (
          <UserRound size={18} />
        )}
      </Link>
    </header>
  );
}
