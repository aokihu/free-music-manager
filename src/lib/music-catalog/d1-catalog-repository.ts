import "server-only";

import { isStoredTrack, normalizeStoredTrack } from "./is-stored-track";
import { canChangeTrackStatus, trackStatusLabels } from "./publication-status";
import type { MusicCatalogRepository } from "./repository-types";
import type {
  MusicDraftInput,
  StoredAlbum,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

type MusicTrackRow = {
  album_id: string | null;
  track_json: string;
};

type MusicAlbumRow = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  created_at: string;
  updated_at: string;
};

function parseStoredTrackRow(row: MusicTrackRow) {
  let value: unknown;

  try {
    value = JSON.parse(row.track_json);
  } catch {
    throw new Error("D1 曲库中的歌曲数据不是有效 JSON");
  }

  if (!isStoredTrack(value)) {
    throw new Error("D1 曲库中的歌曲数据格式无效");
  }

  return normalizeStoredTrack({
    ...value,
    albumId: row.album_id ?? undefined,
  });
}

function parseStoredAlbumRow(row: MusicAlbumRow): StoredAlbum {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class D1MusicCatalogRepository implements MusicCatalogRepository {
  constructor(private readonly database: D1Database) {}

  async listAlbums() {
    const result = await this.database
      .prepare(
        `SELECT id, title, artist, year, created_at, updated_at
         FROM music_albums
         ORDER BY updated_at DESC, title COLLATE NOCASE ASC`,
      )
      .all<MusicAlbumRow>();
    return result.results.map(parseStoredAlbumRow);
  }

  async saveAlbum(album: StoredAlbum) {
    await this.database
      .prepare(
        `INSERT INTO music_albums (id, title, artist, year, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`,
      )
      .bind(
        album.id,
        album.title,
        album.artist,
        album.year ?? null,
        album.createdAt,
        album.updatedAt,
      )
      .run();

    const row = await this.database
      .prepare(
        `SELECT id, title, artist, year, created_at, updated_at
         FROM music_albums
         WHERE lower(title) = lower(?) AND lower(artist) = lower(?)`,
      )
      .bind(album.title, album.artist)
      .first<MusicAlbumRow>();
    if (!row) throw new Error("专辑保存失败");
    return parseStoredAlbumRow(row);
  }

  async deleteTrack(trackId: string) {
    const track = await this.getTrack(trackId);
    if (!track) throw new Error("未找到要删除的歌曲");

    await this.database
      .prepare("DELETE FROM music_tracks WHERE id = ?")
      .bind(trackId)
      .run();

    return track;
  }

  async listTracks() {
    const result = await this.database
      .prepare(
        "SELECT album_id, track_json FROM music_tracks ORDER BY updated_at DESC, id ASC",
      )
      .all<MusicTrackRow>();

    return result.results.map(parseStoredTrackRow);
  }

  async saveTrack(track: StoredTrack) {
    await this.database
      .prepare(
        `INSERT INTO music_tracks
           (id, status, title, updated_at, genre_ids, mood_ids, use_case_ids, album_id, track_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           title = excluded.title,
           updated_at = excluded.updated_at,
           genre_ids = excluded.genre_ids,
           mood_ids = excluded.mood_ids,
           use_case_ids = excluded.use_case_ids,
           album_id = excluded.album_id,
           track_json = excluded.track_json`,
      )
      .bind(
        track.id,
        track.status,
        track.title,
        track.updatedAt,
        JSON.stringify(track.genreIds),
        JSON.stringify(track.moodIds),
        JSON.stringify(track.useCaseIds),
        track.albumId ?? null,
        JSON.stringify(track),
      )
      .run();
  }

  async updateTrackDraft(trackId: string, draft: MusicDraftInput) {
    const currentTrack = await this.getTrack(trackId);
    if (!currentTrack) throw new Error("未找到要编辑的歌曲");

    const updatedTrack: StoredTrack = {
      ...currentTrack,
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    await this.saveTrack(updatedTrack);
    return updatedTrack;
  }

  async updateTrackStatus(
    trackId: string,
    nextStatus: TrackPublicationStatus,
  ) {
    const currentTrack = await this.getTrack(trackId);
    if (!currentTrack) throw new Error("未找到要更新状态的歌曲");

    if (!canChangeTrackStatus(currentTrack.status, nextStatus)) {
      throw new Error(
        `不能从“${trackStatusLabels[currentTrack.status]}”变更为“${trackStatusLabels[nextStatus]}”`,
      );
    }

    const updatedTrack: StoredTrack = {
      ...currentTrack,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await this.saveTrack(updatedTrack);
    return updatedTrack;
  }

  private async getTrack(trackId: string) {
    const row = await this.database
      .prepare("SELECT album_id, track_json FROM music_tracks WHERE id = ?")
      .bind(trackId)
      .first<MusicTrackRow>();

    return row ? parseStoredTrackRow(row) : null;
  }
}
