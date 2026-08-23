import "server-only";

import { createHash } from "node:crypto";
import path from "node:path";
import { parseBuffer } from "music-metadata";

import { getMusicStorage } from "../storage";
import {
  listStoredTracks,
  saveStoredTrack,
  updateStoredTrackDraft,
  updateStoredTrackStatus,
} from "./catalog-repository";
import type {
  ManagerTrack,
  MusicDraftInput,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

const coverExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getSafeAudioExtension(fileName: string) {
  const extension = path.extname(fileName).slice(1).toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(extension) ? extension : "audio";
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function toManagerTrack(track: StoredTrack): ManagerTrack {
  const tags = [
    ...track.genres,
    track.mood,
    track.bpm ? `${track.bpm} BPM` : "",
  ].filter(Boolean);

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genres: track.genres,
    bpm: track.bpm,
    mood: track.mood,
    year: track.year,
    comment: track.comment,
    tags: tags.length > 0 ? tags : ["待补充 Tag"],
    status: track.status,
    updatedAtLabel: formatUpdatedAt(track.updatedAt),
    audio: track.audio,
  };
}

export async function updateMusicTrackDraft(
  trackId: string,
  draft: MusicDraftInput,
) {
  return updateStoredTrackDraft(trackId, draft);
}

export async function updateMusicTrackStatus(
  trackId: string,
  nextStatus: TrackPublicationStatus,
) {
  return updateStoredTrackStatus(trackId, nextStatus);
}

export async function listManagerTracks() {
  const tracks = await listStoredTracks();
  return tracks
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(toManagerTrack);
}

export async function saveMusicToCatalog(
  file: File,
  draft: MusicDraftInput,
) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const id = `track-${sha256.slice(0, 16)}`;
  const metadata = await parseBuffer(
    bytes,
    { mimeType: file.type || undefined, path: file.name, size: file.size },
    { duration: true },
  );
  const storage = getMusicStorage();
  const audioKey = `audio/${id}.${getSafeAudioExtension(file.name)}`;
  const contentType = file.type || "application/octet-stream";
  const existingTrack = (await listStoredTracks()).find(
    (track) => track.id === id,
  );

  await storage.putObject(audioKey, bytes, { contentType });

  const picture = metadata.common.picture?.[0];
  const coverExtension = picture ? coverExtensions[picture.format] : undefined;
  const cover =
    picture && coverExtension
      ? {
          key: `covers/${id}.${coverExtension}`,
          contentType: picture.format,
        }
      : undefined;

  if (picture && cover) {
    await storage.putObject(cover.key, Uint8Array.from(picture.data), {
      contentType: cover.contentType,
    });
  }

  const now = new Date().toISOString();
  const track: StoredTrack = {
    id,
    ...draft,
    status: existingTrack?.status ?? "draft",
    audio: {
      key: audioKey,
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
      sha256,
      container: metadata.format.container,
      durationSeconds: metadata.format.duration,
      bitrateKbps: metadata.format.bitrate
        ? Math.round(metadata.format.bitrate / 1000)
        : undefined,
      sampleRateHz: metadata.format.sampleRate,
      numberOfChannels: metadata.format.numberOfChannels,
    },
    cover,
    createdAt: existingTrack?.createdAt ?? now,
    updatedAt: now,
  };

  await saveStoredTrack(track);
  return track;
}

export type {
  ManagerTrack,
  MusicDraftInput,
  TrackPublicationStatus,
} from "./types";
