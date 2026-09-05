import type { StoredTrack } from "./types";
import {
  findMusicTaxonomyIds,
  musicGenreOptions,
  musicMoodOptions,
  musicUseCaseOptions,
  parseMusicTaxonomyIds,
} from "./music-taxonomy";

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

export function normalizeStoredTrack(value: StoredTrack): StoredTrack {
  const legacyTrack = value as StoredTrack & {
    genres?: string[];
    mood?: string;
  };
  const genreIds = Array.isArray(legacyTrack.genreIds)
    ? parseMusicTaxonomyIds(legacyTrack.genreIds, musicGenreOptions)
    : findMusicTaxonomyIds(legacyTrack.genres ?? [], musicGenreOptions);
  const moodIds = Array.isArray(legacyTrack.moodIds)
    ? parseMusicTaxonomyIds(legacyTrack.moodIds, musicMoodOptions)
    : findMusicTaxonomyIds(legacyTrack.mood ? [legacyTrack.mood] : [], musicMoodOptions);
  const useCaseIds = parseMusicTaxonomyIds(
    legacyTrack.useCaseIds,
    musicUseCaseOptions,
  );
  const track = Object.fromEntries(
    Object.entries(legacyTrack).filter(
      ([key]) => key !== "genres" && key !== "mood",
    ),
  ) as StoredTrack;

  return {
    ...track,
    albumId: typeof legacyTrack.albumId === "string" ? legacyTrack.albumId : undefined,
    genreIds,
    moodIds,
    useCaseIds,
  } satisfies StoredTrack;
}
