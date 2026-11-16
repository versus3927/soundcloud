"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "@/lib/audius";

// ────────────────────────────── Player ──────────────────────────────

export type RepeatMode = 0 | 1 | 2; // off | all | one

interface PlayerState {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playTracks: (tracks: Track[], start?: number) => void;
  playNext: (track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const PlayerCtx = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer outside provider");
  return ctx;
}

function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>(0);
  const historySentRef = useRef<string | null>(null);

  const current = queue[index] ?? null;

  const loadTrack = useCallback(
    (track: Track, autoplay = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      // External tracks: open directly in new tab
      if (track.id.startsWith("sc_") && track.permalink) {
        window.open(track.permalink, "_blank", "noopener");
        return;
      }

      audio.src = `/api/stream/${track.id}`;
      setCurrentTime(0);
      setDuration(track.duration || 0);
      if (autoplay) {
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      if (historySentRef.current !== track.id) {
        historySentRef.current = track.id;
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track }),
        }).catch(() => {});
      }
    },
    [],
  );

  const playTracks = useCallback(
    (tracks: Track[], start = 0) => {
      if (tracks.length === 0) return;
      setQueue(tracks);
      setIndex(start);
      loadTrack(tracks[start]);
    },
    [loadTrack],
  );

  const playNext = useCallback((track: Track) => {
    setQueue((q) => {
      if (q.length === 0) {
        loadTrack(track);
        setIndex(0);
        return [track];
      }
      const copy = [...q];
      copy.splice(index + 1, 0, track);
      return copy;
    });
  }, [index, loadTrack]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (current.id.startsWith("sc_") && current.permalink) {
      return;
    }
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    let ni: number;
    if (shuffle) {
      ni = Math.floor(Math.random() * queue.length);
    } else {
      ni = index + 1;
      if (ni >= queue.length) {
        if (repeat === 1) ni = 0;
        else {
          setIsPlaying(false);
          return;
        }
      }
    }
    setIndex(ni);
    loadTrack(queue[ni]);
  }, [queue, index, shuffle, repeat, loadTrack]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (queue.length === 0) return;
    const pi = index - 1 < 0 ? queue.length - 1 : index - 1;
    setIndex(pi);
    loadTrack(queue[pi]);
  }, [queue, index, loadTrack]);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
    setMuted(v === 0);
    try {
      localStorage.setItem("vc-volume", String(v));
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    try {
      const saved = localStorage.getItem("vc-volume");
      if (saved) audio.volume = Math.min(1, Math.max(0, Number(saved)));
      if (saved) setVolumeState(audio.volume);
    } catch {}
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => {
      if (!Number.isNaN(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      if (repeatRef.current === 2) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      nextRef.current();
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextRef = useRef(next);
  nextRef.current = next;
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  const value = useMemo<PlayerState>(
    () => ({
      queue,
      index,
      current,
      isPlaying,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      playTracks,
      playNext,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle: () => setShuffle((s) => !s),
      cycleRepeat: () => setRepeat((r) => ((r + 1) % 3) as RepeatMode),
    }),
    [queue, index, current, isPlaying, currentTime, duration, volume, muted, shuffle, repeat, playTracks, playNext, toggle, next, prev, seek, setVolume, toggleMute],
  );

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

// ────────────────────────────── Likes ──────────────────────────────

interface LikesState {
  ids: Set<string>;
  toggleLike: (track: Track) => Promise<boolean>;
}

const LikesCtx = createContext<LikesState | null>(null);

export function useLikes() {
  const ctx = useContext(LikesCtx);
  if (!ctx) throw new Error("useLikes outside provider");
  return ctx;
}

function LikesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/likes")
      .then((r) => r.json())
      .then((j) => setIds(new Set(j.ids ?? [])))
      .catch(() => {});
  }, []);

  const toggleLike = useCallback(async (track: Track) => {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track }),
    });
    const json = (await res.json()) as { liked: boolean };
    setIds((prev) => {
      const nextSet = new Set(prev);
      if (json.liked) nextSet.add(track.id);
      else nextSet.delete(track.id);
      return nextSet;
    });
    return json.liked;
  }, []);

  return (
    <LikesCtx.Provider value={{ ids, toggleLike }}>
      {children}
    </LikesCtx.Provider>
  );
}

// ────────────────────────────── Playlists ──────────────────────────────

export interface UserPlaylist {
  id: number;
  name: string;
  description: string;
  coverUrl: string | null;
  trackCount: number;
  effectiveCover: string | null;
  updatedAt: string;
}

interface PlaylistsState {
  playlists: UserPlaylist[];
  refresh: () => Promise<void>;
  create: (name: string) => Promise<UserPlaylist | null>;
  toggleTrack: (playlistId: number, track: Track) => Promise<boolean>;
}

const PlaylistsCtx = createContext<PlaylistsState | null>(null);

export function usePlaylists() {
  const ctx = useContext(PlaylistsCtx);
  if (!ctx) throw new Error("usePlaylists outside provider");
  return ctx;
}

function PlaylistsProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/playlists");
      const json = await res.json();
      setPlaylists(json.playlists ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string) => {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      await refresh();
      return (await res.json()) as UserPlaylist;
    },
    [refresh],
  );

  const toggleTrack = useCallback(
    async (playlistId: number, track: Track) => {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track }),
      });
      await refresh();
      if (!res.ok) return false;
      const json = (await res.json()) as { added: boolean };
      return json.added;
    },
    [refresh],
  );

  return (
    <PlaylistsCtx.Provider value={{ playlists, refresh, create, toggleTrack }}>
      {children}
    </PlaylistsCtx.Provider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <LikesProvider>
        <PlaylistsProvider>{children}</PlaylistsProvider>
      </LikesProvider>
    </PlayerProvider>
  );
}
