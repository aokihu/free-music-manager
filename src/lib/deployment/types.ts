import type { MusicCatalogRepository } from "../music-catalog/repository-types";
import type { MusicStorageAdapter } from "../storage/types";

export type DeploymentProvider = "cloudflare" | "aws" | "server";

export type DeploymentAdapters = {
  catalogRepository: MusicCatalogRepository;
  objectStorage: MusicStorageAdapter;
};
