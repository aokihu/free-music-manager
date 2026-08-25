export type TrackPublicationStatus = "draft" | "published" | "offline";

export type MusicDraftInput = {
  title: string;
  artist: string;
  album: string;
  genreIds: string[];
  bpm?: number;
  moodIds: string[];
  useCaseIds: string[];
  year?: number;
  comment: string;
};

export type StoredAudioFile = {
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

export type StoredTrack = MusicDraftInput & {
  id: string;
  sourceFolderName: string;
  status: TrackPublicationStatus;
  audio: {
    high: StoredAudioFile;
    low: StoredAudioFile;
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
  album: string;
  genreIds: string[];
  genres: string[];
  bpm?: number;
  moodIds: string[];
  moods: string[];
  useCaseIds: string[];
  useCases: string[];
  year?: number;
  comment: string;
  tags: string[];
  status: TrackPublicationStatus;
  updatedAtLabel: string;
  audio: StoredTrack["audio"];
  coverUrl: string;
  hasCover: boolean;
};
