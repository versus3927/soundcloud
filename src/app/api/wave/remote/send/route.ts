import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { waveRemoteLinks } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Phone sends URL */
export async function POST(req: NextRequest) {
  const { code, url } = (await req.json()) as { code: string; url: string };
  if (!code || !url) return NextResponse.json({ error: "Data missing" }, { status: 400 });

  const [link] = await db
    .select()
    .from(waveRemoteLinks)
    .where(eq(waveRemoteLinks.code, code.toUpperCase()))
    .limit(1);

  if (!link) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  await db
    .update(waveRemoteLinks)
    .set({ url, status: "received" })
    .where(eq(waveRemoteLinks.id, link.id));

  return NextResponse.json({ ok: true });
}
