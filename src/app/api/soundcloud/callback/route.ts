import { NextRequest } from "next/server";
import { db } from "@/db";
import { profile, soundcloudAuthSessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrCreateProfile } from "@/lib/local-profile";
import {
  exchangeCodeForToken,
  isSoundCloudConfigured,
  soundCloudGet,
  type SoundCloudUser,
} from "@/lib/soundcloud";
import { userToSoundCloudPatch } from "@/lib/soundcloud-link";

function html(title: string, message: string, ok = true) {
  return new Response(
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>
      body{margin:0;background:#050a07;color:#e8f5ec;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}
      .card{max-width:520px;margin:24px;padding:28px;border:1px solid #1a2a20;border-radius:24px;background:#0a100c;box-shadow:0 20px 80px rgba(0,0,0,.45)}
      .badge{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:#06351c;color:#00e065;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
      h1{margin:14px 0 10px;font-size:28px;line-height:1.05}
      p{margin:0;color:#8fa89a;line-height:1.6}
      .dot{width:10px;height:10px;border-radius:999px;background:${ok ? "#00e065" : "#ff6b6b"};display:inline-block}
      .btn{display:inline-block;margin-top:18px;padding:12px 18px;border-radius:999px;background:#00e065;color:#041007;text-decoration:none;font-weight:800}
    </style></head><body><div class="card"><div class="badge"><span class="dot"></span>${ok ? "SoundCloud connected" : "Connection failed"}</div><h1>${title}</h1><p>${message}</p><a class="btn" href="/profile">Вернуться в профиль</a><script>setTimeout(()=>window.close(),1200)</script></div></body></html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: ok ? 200 : 400,
    },
  );
}

export async function GET(req: NextRequest) {
  if (!isSoundCloudConfigured()) {
    return html(
      "SoundCloud не настроен",
      "На сервере отсутствуют SOUNDCLOUD_CLIENT_ID / SECRET / REDIRECT_URI.",
      false,
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    if (state) {
      await db
        .update(soundcloudAuthSessions)
        .set({ status: "error", error })
        .where(eq(soundcloudAuthSessions.state, state));
    }
    return html("Авторизация отменена", `SoundCloud вернул ошибку: ${error}`, false);
  }

  if (!code || !state) {
    return html(
      "Нет кода авторизации",
      "SoundCloud не прислал code/state в callback.",
      false,
    );
  }

  const [session] = await db
    .select()
    .from(soundcloudAuthSessions)
    .where(and(eq(soundcloudAuthSessions.state, state), eq(soundcloudAuthSessions.status, "pending")))
    .limit(1);

  if (!session) {
    return html(
      "Сессия не найдена",
      "Эта QR / OAuth-сессия уже истекла или была использована.",
      false,
    );
  }

  try {
    const token = await exchangeCodeForToken({
      code,
      codeVerifier: session.codeVerifier,
    });
    const me = await soundCloudGet<SoundCloudUser>("/me", token.access_token);
    const p = await getOrCreateProfile();

    await db
      .update(profile)
      .set({
        ...userToSoundCloudPatch(me, token),
        displayName: p.displayName === "versus" ? me.full_name || me.username : p.displayName,
      })
      .where(eq(profile.id, p.id));

    await db
      .update(soundcloudAuthSessions)
      .set({ status: "completed", completedAt: new Date(), error: null })
      .where(eq(soundcloudAuthSessions.id, session.id));

    return html(
      "SoundCloud подключён",
      `Аккаунт ${me.full_name || me.username} успешно привязан. Можно возвращаться в VERSUSCLOUD.`,
      true,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await db
      .update(soundcloudAuthSessions)
      .set({ status: "error", error: message })
      .where(eq(soundcloudAuthSessions.id, session.id));
    return html("Не удалось подключить SoundCloud", message, false);
  }
}
