import "server-only";

import { getDeploymentAdapters } from "../deployment";
import type {
  MusicDraftInput,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

function getCatalogRepository() {
  return getDeploymentAdapters().catalogRepository;
}

export function listStoredTracks(): Promise<StoredTrack[]> {
  return getCatalogRepository().listTracks();
}

export function saveStoredTrack(track: StoredTrack): Promise<void> {
  return getCatalogRepository().saveTrack(track);
}

export function deleteStoredTrack(trackId: string): Promise<StoredTrack> {
  return getCatalogRepository().deleteTrack(trackId);
}

export function updateStoredTrackDraft(
  trackId: string,
  draft: MusicDraftInput,
): Promise<StoredTrack> {
  return getCatalogRepository().updateTrackDraft(trackId, draft);
}

export function updateStoredTrackStatus(
  trackId: string,
  nextStatus: TrackPublicationStatus,
): Promise<StoredTrack> {
  return getCatalogRepository().updateTrackStatus(trackId, nextStatus);
}
