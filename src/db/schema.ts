import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Single local profile (desktop app → one user). Optionally linked to Audius and Wave. */
export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull().default("versus"),
  avatarUrl: text("avatar_url"),
  
  // Audius link
  audiusHandle: text("audius_handle"),
  audiusUserId: text("audius_user_id"),
  audiusName: text("audius_name"),
  linkedAt: timestamp("linked_at", { withTimezone: true }),

  // Wave link (manual via URL)
  waveProfileUrl: text("wave_profile_url"),
  waveUsername: text("wave_username"),
  waveAvatarUrl: text("wave_avatar_url"),
  waveLinkedAt: timestamp("wave_linked_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Remote transfer of links (Phone -> PC) */
export const waveRemoteLinks = pgTable(
  "wave_remote_links",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    url: text("url"),
    status: text("status").notNull().default("waiting"), // waiting, received
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("wave_remote_code_idx").on(t.code)],
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
    source: text("source").notNull().default("audius"), // "audius" | "wave"
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
