/**
 * Next.js instrumentation hook — runs once when the server boots.
 * Creates the app's tables idempotently so a fresh Railway deploy
 * needs zero manual migration steps.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Pool } = await import("pg");
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const pool = new Pool({ connectionString: url });
  const sql = `
    CREATE TABLE IF NOT EXISTS profile (
      id serial PRIMARY KEY,
      display_name text NOT NULL DEFAULT 'versus',
      audius_handle text,
      audius_user_id text,
      audius_name text,
      avatar_url text,
      linked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS likes (
      id serial PRIMARY KEY,
      track_id text NOT NULL,
      title text NOT NULL,
      artist text NOT NULL,
      artist_handle text NOT NULL DEFAULT '',
      artwork text,
      duration integer NOT NULL DEFAULT 0,
      genre text,
      permalink text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS likes_track_id_idx ON likes (track_id);
    CREATE TABLE IF NOT EXISTS playlists (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text NOT NULL DEFAULT '',
      cover_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id serial PRIMARY KEY,
      playlist_id integer NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      track_id text NOT NULL,
      title text NOT NULL,
      artist text NOT NULL,
      artist_handle text NOT NULL DEFAULT '',
      artwork text,
      duration integer NOT NULL DEFAULT 0,
      permalink text,
      position integer NOT NULL DEFAULT 0,
      added_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS playlist_tracks_unique
      ON playlist_tracks (playlist_id, track_id);
    CREATE TABLE IF NOT EXISTS history (
      id serial PRIMARY KEY,
      track_id text NOT NULL,
      title text NOT NULL,
      artist text NOT NULL,
      artist_handle text NOT NULL DEFAULT '',
      artwork text,
      duration integer NOT NULL DEFAULT 0,
      played_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS history_track_id_idx ON history (track_id);
  `;
  try {
    await pool.query(sql);
    console.log("[versuscloud] database tables ready");
  } catch (err) {
    console.error("[versuscloud] failed to ensure tables:", err);
  } finally {
    await pool.end().catch(() => {});
  }
}
