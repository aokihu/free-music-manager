import "server-only";

import { createHash } from "node:crypto";
import { parseBuffer } from "music-metadata";

import { getMusicStorage } from "../storage";
import {
  deleteStoredTrack,
  listStoredTracks,
  saveStoredTrack,
  updateStoredTrackDraft,
  updateStoredTrackStatus,
} from "./catalog-repository";
import { parseMusicFolderFiles } from "./music-folder";
import { maxCoverFileSizeBytes } from "./music-folder";
import type {
  ManagerTrack,
  MusicDraftInput,
  StoredAudioFile,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

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
    coverUrl: `/api/manager/tracks/${encodeURIComponent(track.id)}/cover?v=${encodeURIComponent(track.updatedAt)}`,
    hasCover: Boolean(track.cover),
  };
}

export async function updateMusicTrackDraft(
  trackId: string,
  draft: MusicDraftInput,
) {
  return updateStoredTrackDraft(trackId, draft);
}

async function readCoverImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "png" && extension !== "jpg" && extension !== "jpeg") {
    throw new Error(`${file.name} 只支持 PNG、JPG 或 JPEG 图片`);
  }
  if (file.size === 0) throw new Error(`${file.name} 是空文件`);
  if (file.size > maxCoverFileSizeBytes) {
    throw new Error(`${file.name} 超过 20 MB`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isJpeg =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isPng && !isJpeg) {
    throw new Error(`${file.name} 不是有效的 PNG 或 JPEG 图片`);
  }
  if ((extension === "png") !== isPng) {
    throw new Error(`${file.name} 的扩展名与图片内容不一致`);
  }

  return {
    bytes,
    contentType: isPng ? "image/png" : "image/jpeg",
    extension,
  };
}

export async function updateMusicTrackContent(
  trackId: string,
  draft: MusicDraftInput,
  coverFile?: File,
  removeCover = false,
) {
  if (!coverFile && !removeCover) return updateStoredTrackDraft(trackId, draft);

  const tracks = await listStoredTracks();
  const currentTrack = tracks.find((track) => track.id === trackId);
  if (!currentTrack) throw new Error("未找到要编辑的歌曲");

  if (removeCover) {
    const updatedTrack: StoredTrack = {
      ...currentTrack,
      ...draft,
      cover: undefined,
      updatedAt: new Date().toISOString(),
    };
    await saveStoredTrack(updatedTrack);
    if (currentTrack.cover) {
      await getMusicStorage().deleteObject(currentTrack.cover.key);
    }
    return updatedTrack;
  }

  if (!coverFile) throw new Error("缺少要替换的封面文件");
  const coverImage = await readCoverImage(coverFile);
  const coverKey = `tracks/${trackId}/cover.${coverImage.extension}`;
  const storage = getMusicStorage();
  await storage.putObject(coverKey, coverImage.bytes, {
    contentType: coverImage.contentType,
  });

  const updatedTrack: StoredTrack = {
    ...currentTrack,
    ...draft,
    cover: {
      key: coverKey,
      contentType: coverImage.contentType,
    },
    updatedAt: new Date().toISOString(),
  };
  await saveStoredTrack(updatedTrack);

  if (currentTrack.cover && currentTrack.cover.key !== coverKey) {
    await storage.deleteObject(currentTrack.cover.key);
  }

  return updatedTrack;
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

export async function deleteMusicTrack(trackId: string) {
  const track = (await listStoredTracks()).find((item) => item.id === trackId);
  if (!track) throw new Error("未找到要删除的歌曲");

  const storage = getMusicStorage();
  const objectKeys = [
    track.audio.high.key,
    track.audio.low.key,
    track.cover?.key,
  ].filter((key): key is string => Boolean(key));
  for (const key of objectKeys) {
    await storage.deleteObject(key);
  }

  return deleteStoredTrack(trackId);
}

export async function saveMusicToCatalog(
  folderName: string,
  files: File[],
  draft: MusicDraftInput,
) {
  const folder = parseMusicFolderFiles(folderName, files);
  const [highBytes, lowBytes, coverImage] = await Promise.all([
    folder.highFile.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
    folder.lowFile.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
    readCoverImage(folder.coverFile),
  ]);
  const isOgg =
    lowBytes[0] === 0x4f &&
    lowBytes[1] === 0x67 &&
    lowBytes[2] === 0x67 &&
    lowBytes[3] === 0x53;
  if (!isOgg) {
    throw new Error(`${folder.lowFile.name} 不是有效的 OGG 音频`);
  }
  const highSha256 = createHash("sha256").update(highBytes).digest("hex");
  const lowSha256 = createHash("sha256").update(lowBytes).digest("hex");
  const id = `track-${highSha256.slice(0, 16)}`;
  const [highMetadata, lowMetadata] = await Promise.all([
    parseBuffer(
      highBytes,
      {
        mimeType: folder.highFile.type || undefined,
        path: folder.highFile.name,
        size: folder.highFile.size,
      },
      { duration: true },
    ),
    parseBuffer(
      lowBytes,
      {
        mimeType: folder.lowFile.type || undefined,
        path: folder.lowFile.name,
        size: folder.lowFile.size,
      },
      { duration: true },
    ),
  ]);
  const storage = getMusicStorage();
  const trackRootKey = `tracks/${id}`;
  const highKey = `${trackRootKey}/${folder.highFile.name}`;
  const lowKey = `${trackRootKey}/${folder.lowFile.name}`;
  const coverKey = `${trackRootKey}/cover.${coverImage.extension}`;
  const existingTrack = (await listStoredTracks()).find(
    (track) => track.id === id,
  );

  await Promise.all([
    storage.putObject(highKey, highBytes, {
      contentType: folder.highFile.type || "application/octet-stream",
    }),
    storage.putObject(lowKey, lowBytes, {
      contentType: folder.lowFile.type || "application/octet-stream",
    }),
  ]);

  const cover = {
    key: coverKey,
    contentType: coverImage.contentType,
  };
  await storage.putObject(cover.key, coverImage.bytes, {
    contentType: cover.contentType,
  });

  function createStoredAudioFile(
    file: File,
    key: string,
    sha256: string,
    metadata: Awaited<ReturnType<typeof parseBuffer>>,
  ): StoredAudioFile {
    return {
      key,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      sha256,
      container: metadata.format.container,
      durationSeconds: metadata.format.duration,
      bitrateKbps: metadata.format.bitrate
        ? Math.round(metadata.format.bitrate / 1000)
        : undefined,
      sampleRateHz: metadata.format.sampleRate,
      numberOfChannels: metadata.format.numberOfChannels,
    };
  }

  const now = new Date().toISOString();
  const track: StoredTrack = {
    id,
    sourceFolderName: folder.folderName,
    ...draft,
    status: existingTrack?.status ?? "draft",
    audio: {
      high: createStoredAudioFile(
        folder.highFile,
        highKey,
        highSha256,
        highMetadata,
      ),
      low: createStoredAudioFile(folder.lowFile, lowKey, lowSha256, lowMetadata),
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
