"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, ListMusic, Pencil, Play, Trash2 } from "lucide-react";
import { TrackList } from "@/components/track-row";
import { Artwork } from "@/components/artwork";
import { usePlayer, usePlaylists } from "@/components/providers";
import { cn, snapToTrack } from "@/lib/utils";
import type { Track } from "@/lib/audius";

interface PlaylistDetail {
  id: number;
  name: string;
  description: string;
  coverUrl: string | null;
  tracks: {
    trackId: string;
    title: string;
    artist: string;
    artistHandle: string;
    artwork: string | null;
    duration: number;
    permalink: string | null;
  }[];
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const p = usePlayer();
  const { refresh } = usePlaylists();
  const [pl, setPl] = useState<PlaylistDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/playlists/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setPl)
      .catch(() => setPl(null));
  }, [id]);

  useEffect(load, [load]);

  if (!pl) {
    return (
      <div className="grid h-full place-items-center text-sm text-mist">
        Загружаем плейлист…
      </div>
    );
  }

  const tracks: Track[] = pl.tracks.map(snapToTrack);
  const cover = pl.coverUrl ?? pl.tracks[0]?.artwork ?? null;

  const save = async () => {
    await fetch(`/api/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    load();
    refresh();
  };

  const remove = async () => {
    if (!confirm(`Удалить плейлист «${pl.name}»?`)) return;
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    await refresh();
    router.push("/library");
  };

  return (
    <div className="px-8 pt-8 pb-12">
      {/* header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end">
        <Artwork
          src={cover}
          alt={pl.name}
          size={200}
          className="h-[200px] w-[200px] rounded-3xl border border-line shadow-2xl shadow-black/50"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
            Плейлист
          </div>
          {editing ? (
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full max-w-md rounded-xl border border-accent/50 bg-surface px-4 py-2 text-xl font-bold text-ink outline-none"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Описание…"
                rows={2}
                className="w-full max-w-md rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/50"
              />
            </div>
          ) : (
            <>
              <h1 className="font-display mb-2 truncate text-4xl font-black tracking-tight">
                {pl.name}
              </h1>
              {pl.description && (
                <p className="mb-2 max-w-xl text-sm text-mist">{pl.description}</p>
              )}
            </>
          )}
          <div className="mb-4 text-xs text-faint">
            {tracks.length} {plural(tracks.length)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => tracks.length && p.playTracks(tracks, 0)}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(0,224,101,0.4)] transition-all hover:scale-105"
            >
              <Play size={16} fill="currentColor" /> Слушать
            </button>
            <button
              onClick={() => {
                setName(pl.name);
                setDesc(pl.description);
                setEditing((e) => !e);
              }}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-xs font-semibold text-mist transition-colors hover:border-accent/40 hover:text-ink"
            >
              <Pencil size={13} /> {editing ? "Отмена" : "Изменить"}
            </button>
            {editing && (
              <button
                onClick={save}
                disabled={!name.trim()}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-40",
                  saved
                    ? "border-accent text-accent"
                    : "border-accent/60 text-accent hover:bg-accent-soft",
                )}
              >
                <Check size={13} /> {saved ? "Сохранено" : "Сохранить"}
              </button>
            )}
            <button
              onClick={remove}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-xs font-semibold text-mist transition-colors hover:border-red-400/50 hover:text-red-300"
            >
              <Trash2 size={13} /> Удалить
            </button>
          </div>
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className="rounded-2xl border border-line bg-panel/60 p-2">
          <TrackList tracks={tracks} />
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line py-20 text-center">
          <ListMusic className="mb-3 text-faint" size={26} />
          <p className="max-w-sm text-sm text-mist">
            Плейлист пуст. Нажми на иконку «список+» у любого трека, чтобы
            добавить его сюда.
          </p>
        </div>
      )}
    </div>
  );
}

function plural(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "трек";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "трека";
  return "треков";
}
