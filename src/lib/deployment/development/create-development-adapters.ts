import "server-only";

import path from "node:path";

import { JsonMusicCatalogRepository } from "../../music-catalog/json-catalog-repository";
import { LocalMusicStorageAdapter } from "../../storage/local-storage-adapter";
import type { DeploymentAdapters } from "../types";

export function createDevelopmentAdapters(): DeploymentAdapters {
  const objectStorage = new LocalMusicStorageAdapter(
    path.join(process.cwd(), "storage"),
  );

  return {
    catalogRepository: new JsonMusicCatalogRepository(objectStorage),
    objectStorage,
  };
}
