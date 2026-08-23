export type TrackPublicationStatus = "draft" | "published" | "offline";

export type MusicDraftInput = {
  title: string;
  artist: string;
  album: string;
  genres: string[];
  bpm?: number;
  mood: string;
  year?: number;
  comment: string;
};

export type StoredTrack = MusicDraftInput & {
  id: string;
  status: TrackPublicationStatus;
  audio: {
    key: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    sha256: string;
    container?: string;
    durationSeconds?: number;
    bitrateKbps?: number;
    sampleRateHz?: number;
    numberOfChannels?: number;
  };
  cover?: {
    key: string;
    contentType: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ManagerTrack = {
  id: string;
  title: string;
  artist: string;
  tags: string[];
  status: TrackPublicationStatus;
  updatedAtLabel: string;
};
