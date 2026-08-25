ALTER TABLE music_tracks
  ADD COLUMN genre_ids TEXT NOT NULL DEFAULT '[]';

ALTER TABLE music_tracks
  ADD COLUMN mood_ids TEXT NOT NULL DEFAULT '[]';

CREATE INDEX music_tracks_genre_ids_idx
  ON music_tracks (genre_ids);

CREATE INDEX music_tracks_mood_ids_idx
  ON music_tracks (mood_ids);
