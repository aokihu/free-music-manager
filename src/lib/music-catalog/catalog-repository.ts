import "server-only";

import { getMusicStorage } from "../storage";
import { canChangeTrackStatus, trackStatusLabels } from "./publication-status";
import type {
  MusicDraftInput,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

const catalogKey = "catalog/tracks.json";
let catalogWriteQueue = Promise.resolve();

async function writeCatalog(tracks: StoredTrack[]) {
  const catalogBytes = new TextEncoder().encode(JSON.stringify(tracks, null, 2));
  await getMusicStorage().putObject(catalogKey, catalogBytes, {
    contentType: "application/json",
  });
}

async function queueCatalogWrite<T>(operation: () => Promise<T>) {
  const currentWrite = catalogWriteQueue.then(operation, operation);
  catalogWriteQueue = currentWrite.then(
    () => undefined,
    () => undefined,
  );
  return currentWrite;
}

function isStoredTrack(value: unknown): value is StoredTrack {
  if (!value || typeof value !== "object") return false;
  const track = value as Partial<StoredTrack>;
  return Boolean(
    typeof track.id === "string" &&
      typeof track.title === "string" &&
      typeof track.createdAt === "string" &&
      typeof track.updatedAt === "string" &&
      track.audio &&
      typeof track.audio.key === "string" &&
      typeof track.audio.sha256 === "string",
  );
}

export async function listStoredTracks() {
  const catalogBytes = await getMusicStorage().getObject(catalogKey);
  if (!catalogBytes) return [];

  let catalog: unknown;
  try {
    catalog = JSON.parse(new TextDecoder().decode(catalogBytes));
  } catch {
    throw new Error("本地曲库索引损坏，无法读取 catalog/tracks.json");
  }

  if (!Array.isArray(catalog) || !catalog.every(isStoredTrack)) {
    throw new Error("本地曲库索引格式无效");
  }

  return catalog;
}

export async function saveStoredTrack(track: StoredTrack) {
  await queueCatalogWrite(async () => {
    const tracks = await listStoredTracks();
    const existingIndex = tracks.findIndex((item) => item.id === track.id);

    if (existingIndex >= 0) tracks[existingIndex] = track;
    else tracks.unshift(track);

    await writeCatalog(tracks);
  });
}

export async function updateStoredTrackDraft(
  trackId: string,
  draft: MusicDraftInput,
) {
  return queueCatalogWrite(async () => {
    const tracks = await listStoredTracks();
    const trackIndex = tracks.findIndex((track) => track.id === trackId);
    if (trackIndex < 0) throw new Error("未找到要编辑的歌曲");

    const updatedTrack: StoredTrack = {
      ...tracks[trackIndex],
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    tracks[trackIndex] = updatedTrack;
    await writeCatalog(tracks);
    return updatedTrack;
  });
}

export async function updateStoredTrackStatus(
  trackId: string,
  nextStatus: TrackPublicationStatus,
) {
  return queueCatalogWrite(async () => {
    const tracks = await listStoredTracks();
    const trackIndex = tracks.findIndex((track) => track.id === trackId);
    if (trackIndex < 0) throw new Error("未找到要更新状态的歌曲");

    const currentTrack = tracks[trackIndex];
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
    tracks[trackIndex] = updatedTrack;
    await writeCatalog(tracks);
    return updatedTrack;
  });
}
