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
      soundcloud_user_urn text,
      soundcloud_username text,
      soundcloud_full_name text,
      soundcloud_permalink text,
      soundcloud_permalink_url text,
      soundcloud_avatar_url text,
      soundcloud_access_token text,
      soundcloud_refresh_token text,
      soundcloud_token_expires_at timestamptz,
      soundcloud_linked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_user_urn text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_username text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_full_name text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_permalink text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_permalink_url text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_avatar_url text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_access_token text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_refresh_token text;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_token_expires_at timestamptz;
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_linked_at timestamptz;

    CREATE TABLE IF NOT EXISTS soundcloud_auth_sessions (
      id serial PRIMARY KEY,
      session_id text NOT NULL,
      state text NOT NULL,
      code_verifier text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      error text,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS soundcloud_auth_sessions_session_idx
      ON soundcloud_auth_sessions (session_id);
    CREATE UNIQUE INDEX IF NOT EXISTS soundcloud_auth_sessions_state_idx
      ON soundcloud_auth_sessions (state);

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
