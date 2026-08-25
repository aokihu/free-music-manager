import type { StoredTrack } from "./types";

export function isStoredTrack(value: unknown): value is StoredTrack {
  if (!value || typeof value !== "object") return false;

  const track = value as Partial<StoredTrack>;
  return Boolean(
    typeof track.id === "string" &&
      typeof track.title === "string" &&
      typeof track.sourceFolderName === "string" &&
      typeof track.createdAt === "string" &&
      typeof track.updatedAt === "string" &&
      track.audio &&
      typeof track.audio.high?.key === "string" &&
      typeof track.audio.high.sha256 === "string" &&
      typeof track.audio.low?.key === "string" &&
      typeof track.audio.low.sha256 === "string" &&
      (!track.cover ||
        (typeof track.cover.key === "string" &&
          typeof track.cover.contentType === "string")),
  );
}
