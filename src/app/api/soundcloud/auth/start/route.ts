import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { soundcloudAuthSessions } from "@/db/schema";
import {
  buildSoundCloudAuthorizeUrl,
  createPkcePair,
  isSoundCloudConfigured,
} from "@/lib/soundcloud";
import QRCode from "qrcode";

export async function POST() {
  if (!isSoundCloudConfigured()) {
    return NextResponse.json(
      {
        error:
          "SoundCloud OAuth не настроен. Нужны SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET и SOUNDCLOUD_REDIRECT_URI.",
      },
      { status: 503 },
    );
  }

  const { codeVerifier, codeChallenge, state } = createPkcePair();
  const sessionId = randomUUID();
  const authorizeUrl = buildSoundCloudAuthorizeUrl({
    state,
    codeChallenge,
    mobile: true,
  });
  const qrDataUrl = await QRCode.toDataURL(authorizeUrl, {
    margin: 1,
    width: 260,
    color: {
      dark: "#0b6b33",
      light: "#ffffff",
    },
  });

  await db.insert(soundcloudAuthSessions).values({
    sessionId,
    state,
    codeVerifier,
    status: "pending",
  });

  return NextResponse.json({ sessionId, authorizeUrl, qrDataUrl });
}
