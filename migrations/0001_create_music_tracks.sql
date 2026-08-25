CREATE TABLE music_tracks (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'offline')),
  title TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  track_json TEXT NOT NULL
);

CREATE INDEX music_tracks_status_updated_at_idx
  ON music_tracks (status, updated_at DESC);

CREATE INDEX music_tracks_updated_at_idx
  ON music_tracks (updated_at DESC);
