import "server-only";

import type { MusicStorageAdapter } from "../storage/types";
import { canChangeTrackStatus, trackStatusLabels } from "./publication-status";
import { isStoredTrack } from "./is-stored-track";
import type { MusicCatalogRepository } from "./repository-types";
import type {
  MusicDraftInput,
  StoredTrack,
  TrackPublicationStatus,
} from "./types";

const catalogKey = "catalog/tracks.json";

export class JsonMusicCatalogRepository implements MusicCatalogRepository {
  private catalogWriteQueue = Promise.resolve();

  constructor(private readonly storage: MusicStorageAdapter) {}

  async deleteTrack(trackId: string) {
    return this.queueCatalogWrite(async () => {
      const tracks = await this.listTracks();
      const trackIndex = tracks.findIndex((track) => track.id === trackId);
      if (trackIndex < 0) throw new Error("未找到要删除的歌曲");

      const [deletedTrack] = tracks.splice(trackIndex, 1);
      await this.writeCatalog(tracks);
      return deletedTrack;
    });
  }

  async listTracks() {
    const catalogBytes = await this.storage.getObject(catalogKey);
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

  async saveTrack(track: StoredTrack) {
    await this.queueCatalogWrite(async () => {
      const tracks = await this.listTracks();
      const existingIndex = tracks.findIndex((item) => item.id === track.id);

      if (existingIndex >= 0) tracks[existingIndex] = track;
      else tracks.unshift(track);

      await this.writeCatalog(tracks);
    });
  }

  async updateTrackDraft(trackId: string, draft: MusicDraftInput) {
    return this.queueCatalogWrite(async () => {
      const tracks = await this.listTracks();
      const trackIndex = tracks.findIndex((track) => track.id === trackId);
      if (trackIndex < 0) throw new Error("未找到要编辑的歌曲");

      const updatedTrack: StoredTrack = {
        ...tracks[trackIndex],
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      tracks[trackIndex] = updatedTrack;
      await this.writeCatalog(tracks);
      return updatedTrack;
    });
  }

  async updateTrackStatus(
    trackId: string,
    nextStatus: TrackPublicationStatus,
  ) {
    return this.queueCatalogWrite(async () => {
      const tracks = await this.listTracks();
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
      await this.writeCatalog(tracks);
      return updatedTrack;
    });
  }

  private async queueCatalogWrite<T>(operation: () => Promise<T>) {
    const currentWrite = this.catalogWriteQueue.then(operation, operation);
    this.catalogWriteQueue = currentWrite.then(
      () => undefined,
      () => undefined,
    );
    return currentWrite;
  }

  private async writeCatalog(tracks: StoredTrack[]) {
    const catalogBytes = new TextEncoder().encode(
      JSON.stringify(tracks, null, 2),
    );
    await this.storage.putObject(catalogKey, catalogBytes, {
      contentType: "application/json",
    });
  }
}
