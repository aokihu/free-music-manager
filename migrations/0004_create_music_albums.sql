CREATE TABLE music_albums (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  year INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX music_albums_title_artist_idx
  ON music_albums (lower(title), lower(artist));

ALTER TABLE music_tracks
  ADD COLUMN album_id TEXT;

CREATE INDEX music_tracks_album_id_idx
  ON music_tracks (album_id);

INSERT OR IGNORE INTO music_albums (id, title, artist, year, created_at, updated_at)
SELECT
  'album-' || lower(hex(randomblob(8))),
  trim(json_extract(track_json, '$.album')),
  trim(coalesce(json_extract(track_json, '$.artist'), '')),
  json_extract(track_json, '$.year'),
  coalesce(json_extract(track_json, '$.createdAt'), updated_at),
  updated_at
FROM music_tracks
WHERE trim(coalesce(json_extract(track_json, '$.album'), '')) <> ''
GROUP BY
  lower(trim(json_extract(track_json, '$.album'))),
  lower(trim(coalesce(json_extract(track_json, '$.artist'), '')));

UPDATE music_tracks
SET album_id = (
  SELECT album.id
  FROM music_albums AS album
  WHERE lower(album.title) = lower(trim(json_extract(music_tracks.track_json, '$.album')))
    AND lower(album.artist) = lower(trim(coalesce(json_extract(music_tracks.track_json, '$.artist'), '')))
  LIMIT 1
)
WHERE trim(coalesce(json_extract(track_json, '$.album'), '')) <> '';
