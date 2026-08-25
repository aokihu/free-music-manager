import "server-only";

import { getDeploymentAdapters } from "../deployment";
import type { MusicStorageAdapter } from "./types";

export function getMusicStorage(): MusicStorageAdapter {
  return getDeploymentAdapters().objectStorage;
}

export type { MusicStorageAdapter, StoredObjectOptions } from "./types";
