import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { soundcloudAuthSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const [session] = await db
    .select()
    .from(soundcloudAuthSessions)
    .where(eq(soundcloudAuthSessions.sessionId, sessionId))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: session.status,
    error: session.error,
    completedAt: session.completedAt,
  });
}
