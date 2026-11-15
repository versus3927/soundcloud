import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Single local profile (desktop app → one user). Optionally linked to Audius and SoundCloud. */
export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull().default("versus"),
  audiusHandle: text("audius_handle"),
  audiusUserId: text("audius_user_id"),
  audiusName: text("audius_name"),
  avatarUrl: text("avatar_url"),
  linkedAt: timestamp("linked_at", { withTimezone: true }),
  soundcloudUserUrn: text("soundcloud_user_urn"),
  soundcloudUsername: text("soundcloud_username"),
  soundcloudFullName: text("soundcloud_full_name"),
  soundcloudPermalink: text("soundcloud_permalink"),
  soundcloudPermalinkUrl: text("soundcloud_permalink_url"),
  soundcloudAvatarUrl: text("soundcloud_avatar_url"),
  soundcloudAccessToken: text("soundcloud_access_token"),
  soundcloudRefreshToken: text("soundcloud_refresh_token"),
  soundcloudTokenExpiresAt: timestamp("soundcloud_token_expires_at", {
    withTimezone: true,
  }),
  soundcloudLinkedAt: timestamp("soundcloud_linked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const soundcloudAuthSessions = pgTable(
  "soundcloud_auth_sessions",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    state: text("state").notNull(),
    codeVerifier: text("code_verifier").notNull(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("soundcloud_auth_sessions_session_idx").on(t.sessionId),
    uniqueIndex("soundcloud_auth_sessions_state_idx").on(t.state),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    trackId: text("track_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artistHandle: text("artist_handle").notNull().default(""),
    artwork: text("artwork"),
    duration: integer("duration").notNull().default(0),
    genre: text("genre"),
    permalink: text("permalink"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("likes_track_id_idx").on(t.trackId)],
);

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const playlistTracks = pgTable(
  "playlist_tracks",
  {
    id: serial("id").primaryKey(),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: text("track_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artistHandle: text("artist_handle").notNull().default(""),
    artwork: text("artwork"),
    duration: integer("duration").notNull().default(0),
    permalink: text("permalink"),
    position: integer("position").notNull().default(0),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("playlist_tracks_unique").on(t.playlistId, t.trackId),
  ],
);

export const history = pgTable(
  "history",
  {
    id: serial("id").primaryKey(),
    trackId: text("track_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artistHandle: text("artist_handle").notNull().default(""),
    artwork: text("artwork"),
    duration: integer("duration").notNull().default(0),
    playedAt: timestamp("played_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("history_track_id_idx").on(t.trackId)],
);
