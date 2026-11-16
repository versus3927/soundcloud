export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { Pool } = await import("pg");
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`
      -- profile
      CREATE TABLE IF NOT EXISTS profile (
        id serial PRIMARY KEY,
        display_name text NOT NULL DEFAULT 'versus',
        avatar_url text,
        audius_handle text,
        audius_user_id text,
        audius_name text,
        linked_at timestamptz,
        soundcloud_profile_url text,
        soundcloud_username text,
        soundcloud_avatar_url text,
        soundcloud_linked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS avatar_url text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS audius_handle text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS audius_user_id text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS audius_name text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS linked_at timestamptz;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_profile_url text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_username text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_avatar_url text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS soundcloud_linked_at timestamptz;

      -- remote links
      CREATE TABLE IF NOT EXISTS soundcloud_remote_links (
        id serial PRIMARY KEY,
        code text NOT NULL,
        url text,
        status text NOT NULL DEFAULT 'waiting',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS soundcloud_remote_code_idx
        ON soundcloud_remote_links (code);

      -- likes
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
        source text NOT NULL DEFAULT 'audius',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS likes_track_id_idx ON likes (track_id);
      ALTER TABLE likes ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'audius';

      -- playlists
      CREATE TABLE IF NOT EXISTS playlists (
        id serial PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        cover_url text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- playlist_tracks
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

      -- history
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
    `);
    console.log("[versuscloud] DB tables ready");
  } catch (err) {
    console.error("[versuscloud] DB init error:", err);
  } finally {
    await pool.end().catch(() => {});
  }
}
