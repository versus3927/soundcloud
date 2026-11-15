import { db } from "@/db";
import { profile } from "@/db/schema";

export async function getOrCreateProfile() {
  const rows = await db.select().from(profile).limit(1);
  if (rows.length > 0) return rows[0];
  const inserted = await db.insert(profile).values({}).returning();
  return inserted[0];
}
