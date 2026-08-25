ALTER TABLE music_tracks
  ADD COLUMN use_case_ids TEXT NOT NULL DEFAULT '[]';

CREATE INDEX music_tracks_use_case_ids_idx
  ON music_tracks (use_case_ids);
