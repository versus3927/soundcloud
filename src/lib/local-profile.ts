import { Pool } from "pg";

/** Returns raw profile row using raw SQL — bypass Drizzle ORM type issues when columns mismatch. */
export async function getOrCreateProfile() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const r = await pool.query(`SELECT * FROM profile LIMIT 1`);
    if (r.rows.length > 0) {
      return normalizeRow(r.rows[0]);
    }
    const ins = await pool.query(
      `INSERT INTO profile (display_name) VALUES ('versus') RETURNING *`,
    );
    return normalizeRow(ins.rows[0]);
  } finally {
    await pool.end();
  }
}

export async function patchProfile(id: number, patch: Record<string, unknown>) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const keys = Object.keys(patch);
    if (keys.length === 0) {
      const r = await pool.query(`SELECT * FROM profile WHERE id = $1`, [id]);
      return normalizeRow(r.rows[0]);
    }
    const setClauses = keys.map((k, i) => `${toSnake(k)} = $${i + 2}`).join(", ");
    const values = [id, ...keys.map((k) => patch[k])];
    const r = await pool.query(
      `UPDATE profile SET ${setClauses} WHERE id = $1 RETURNING *`,
      values,
    );
    return normalizeRow(r.rows[0]);
  } finally {
    await pool.end();
  }
}

function toSnake(key: string) {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function normalizeRow(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    displayName: (row.display_name as string) ?? "versus",
    avatarUrl: (row.avatar_url as string | null) ?? null,
    audiusHandle: (row.audius_handle as string | null) ?? null,
    audiusUserId: (row.audius_user_id as string | null) ?? null,
    audiusName: (row.audius_name as string | null) ?? null,
    linkedAt: (row.linked_at as Date | null) ?? null,
    soundcloudProfileUrl: (row.soundcloud_profile_url as string | null) ?? null,
    soundcloudUsername: (row.soundcloud_username as string | null) ?? null,
    soundcloudAvatarUrl: (row.soundcloud_avatar_url as string | null) ?? null,
    soundcloudLinkedAt: (row.soundcloud_linked_at as Date | null) ?? null,
    createdAt: row.created_at as Date,
  };
}

export type LocalProfile = Awaited<ReturnType<typeof getOrCreateProfile>>;
