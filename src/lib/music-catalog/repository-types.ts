import type {
  MusicDraftInput,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

export interface MusicCatalogRepository {
  deleteTrack(trackId: string): Promise<StoredTrack>;
  listTracks(): Promise<StoredTrack[]>;
  saveTrack(track: StoredTrack): Promise<void>;
  updateTrackDraft(
    trackId: string,
    draft: MusicDraftInput,
  ): Promise<StoredTrack>;
  updateTrackStatus(
    trackId: string,
    nextStatus: TrackPublicationStatus,
  ): Promise<StoredTrack>;
}
