"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, Cloud, Send, Smartphone } from "lucide-react";

export default function RemotePage() {
  const { code } = useParams<{ code: string }>();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/soundcloud/remote/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, url: url.trim() }),
      });
      if (res.ok) {
        setDone(true);
        setUrl("");
      } else {
        const j = await res.json();
        setError(j.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050a07] p-6 text-center text-ink">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Smartphone size={32} />
      </div>
      <h1 className="font-display mb-2 text-2xl font-black tracking-tight">
        VERSUS<span className="text-accent">CLOUD</span> Remote
      </h1>
      <p className="mb-8 max-w-xs text-sm text-mist">
        Вставь ссылку на SoundCloud (трек или плейлист), и она сразу откроется на твоем ПК.
      </p>

      {done ? (
        <div className="fade-up flex flex-col items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-black">
            <Check size={24} />
          </div>
          <p className="font-semibold text-accent">Отправлено!</p>
          <button
            onClick={() => setDone(false)}
            className="text-xs text-mist underline"
          >
            Отправить еще одну
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://soundcloud.com/..."
              className="h-14 w-full rounded-2xl border border-line bg-panel px-4 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-40"
          >
            {loading ? "Отправка..." : "Играть на ПК"}
            <Send size={16} />
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      )}

      <div className="mt-12 flex items-center gap-2 text-[10px] text-faint uppercase tracking-widest">
        <Cloud size={12} />
        Powered by SoundCloud
      </div>
    </div>
  );
}
