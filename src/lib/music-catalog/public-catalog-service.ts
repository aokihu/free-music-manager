import "server-only";

import { listStoredTracks } from "./catalog-repository";
import {
  getMusicTaxonomyLabels,
  musicGenreOptions,
  musicMoodOptions,
  musicUseCaseOptions,
} from "./music-taxonomy";
import type { StoredTrack } from "./types";

export const publicApiCorsHeaders = {
  "Access-Control-Allow-Headers": "If-None-Match, Range",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers":
    "Accept-Ranges, Content-Length, Content-Range, Content-Type, ETag",
};

function createPublicUrl(origin: string, pathname: string) {
  return new URL(pathname, origin).toString();
}

function toPublicTrack(track: StoredTrack, origin: string) {
  const trackPath = `/api/tracks/${encodeURIComponent(track.id)}`;
  const genres = getMusicTaxonomyLabels(track.genreIds, musicGenreOptions);
  const moods = getMusicTaxonomyLabels(track.moodIds, musicMoodOptions);
  const useCases = getMusicTaxonomyLabels(
    track.useCaseIds,
    musicUseCaseOptions,
  );

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    mood: moods[0] ?? "",
    moods,
    moodIds: track.moodIds,
    genre: genres[0] ?? "",
    genres,
    genreIds: track.genreIds,
    useCases,
    useCaseIds: track.useCaseIds,
    bpm: track.bpm ?? null,
    durationSeconds: track.audio.low.durationSeconds ?? null,
    coverUrl: createPublicUrl(
      origin,
      track.cover ? `${trackPath}/cover` : "/cover-placeholder.png",
    ),
    licenseLabel: "开放授权 BGM",
    preview: {
      url: createPublicUrl(origin, `${trackPath}/preview`),
      mimeType: "audio/ogg" as const,
      bitrateKbps: track.audio.low.bitrateKbps ?? null,
    },
    download: {
      state: "unavailable" as const,
      reason: "高清下载接口尚未开放",
    },
  };
}

export async function listPublicTracks(origin: string) {
  const tracks = await listStoredTracks();
  return tracks
    .filter((track) => track.status === "published")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((track) => toPublicTrack(track, origin));
}

export async function getPublishedTrack(trackId: string) {
  const tracks = await listStoredTracks();
  return (
    tracks.find(
      (track) => track.id === trackId && track.status === "published",
    ) ?? null
  );
}

export function createPublicApiError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        ...publicApiCorsHeaders,
        "Cache-Control": "no-store",
      },
    },
  );
}
