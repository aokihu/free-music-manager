import "server-only";

import { getMusicStorage } from "../storage";
import type { StoredTrack } from "./types";

const catalogKey = "catalog/tracks.json";
let catalogWriteQueue = Promise.resolve();

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
  const writeTrack = async () => {
    const tracks = await listStoredTracks();
    const existingIndex = tracks.findIndex((item) => item.id === track.id);

    if (existingIndex >= 0) tracks[existingIndex] = track;
    else tracks.unshift(track);

    const catalogBytes = new TextEncoder().encode(
      JSON.stringify(tracks, null, 2),
    );
    await getMusicStorage().putObject(catalogKey, catalogBytes, {
      contentType: "application/json",
    });
  };

  const currentWrite = catalogWriteQueue.then(writeTrack, writeTrack);
  catalogWriteQueue = currentWrite.then(
    () => undefined,
    () => undefined,
  );
  await currentWrite;
}
