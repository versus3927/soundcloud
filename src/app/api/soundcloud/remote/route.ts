import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { soundcloudRemoteLinks } from "@/db/schema";
import { eq } from "drizzle-orm";

/** PC creates a code */
export async function POST() {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  await db.insert(soundcloudRemoteLinks).values({ code });
  return NextResponse.json({ code });
}

/** PC polls for URL */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const [link] = await db
    .select()
    .from(soundcloudRemoteLinks)
    .where(eq(soundcloudRemoteLinks.code, code.toUpperCase()))
    .limit(1);

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (link.status === "received" && link.url) {
    // Reset after reading
    await db.update(soundcloudRemoteLinks).set({ status: "waiting", url: null }).where(eq(soundcloudRemoteLinks.id, link.id));
    return NextResponse.json({ url: link.url });
  }

  return NextResponse.json({ status: "waiting" });
}
