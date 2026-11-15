import { NextRequest, NextResponse } from "next/server";
import { audius } from "@/lib/audius";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const url = await audius.streamUrl(id);
  return NextResponse.redirect(url, 302);
}
